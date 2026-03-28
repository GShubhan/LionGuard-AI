/**
 * Tinyfish - Lightweight AI Agent Orchestration Framework
 *
 * Provides agent and tool primitives for building multi-step AI workflows.
 * The agent executes tool calls in sequence, collects results, and passes
 * them to an LLM for final structured reasoning.
 */

class Tool {
  constructor({ name, description, execute }) {
    this.name = name;
    this.description = description;
    this.execute = execute;
  }
}

class Agent {
  constructor({ name, role, tools = [], onStep = null }) {
    this.name = name;
    this.role = role;
    this.tools = tools;
    this.onStep = onStep; // Optional callback for streaming step updates
    this.toolMap = {};
    for (const tool of tools) {
      this.toolMap[tool.name] = tool;
    }
  }

  getTool(name) {
    return this.toolMap[name] || null;
  }

  async runTool(name, args) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found on agent "${this.name}"`);
    }
    if (this.onStep) {
      this.onStep({ tool: name, status: 'running', args });
    }
    const result = await tool.execute(args);
    if (this.onStep) {
      this.onStep({ tool: name, status: 'done', result });
    }
    return result;
  }
}

class Workflow {
  constructor({ agent, steps }) {
    this.agent = agent;
    this.steps = steps; // Array of async functions (context) => context
  }

  async run(initialContext = {}) {
    let context = { ...initialContext };
    for (const step of this.steps) {
      context = await step(context, this.agent);
    }
    return context;
  }
}

module.exports = { Tool, Agent, Workflow };
