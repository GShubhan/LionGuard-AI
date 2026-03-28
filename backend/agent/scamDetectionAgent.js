const { Agent, Workflow } = require('./tinyfish');
const scrapeInput = require('../tools/scrapeInput');
const checkCompanyRegistry = require('../tools/checkCompanyRegistry');
const checkDomain = require('../tools/checkDomain');
const detectScamPatterns = require('../tools/detectScamPatterns');

/**
 * ScamDetectionAgent — Fraud analyst specialized in Singapore scams.
 *
 * Orchestrates a multi-step investigation:
 * 1. Scrape / parse the input
 * 2. Verify the company in the ACRA registry
 * 3. Check domain signals (if URL)
 * 4. Detect scam linguistic patterns
 * 5. Pass all findings to OpenAI for final structured verdict
 */
function createScamDetectionAgent({ onStep } = {}) {
  return new Agent({
    name: 'ScamDetectionAgent',
    role: 'Fraud analyst specialized in Singapore scams',
    tools: [scrapeInput, checkCompanyRegistry, checkDomain, detectScamPatterns],
    onStep,
  });
}

/**
 * Build the Tinyfish Workflow for scam analysis.
 * Each step is a pure async function (context, agent) => updatedContext.
 */
function createScamWorkflow(agent) {
  return new Workflow({
    agent,
    steps: [
      // Step 1: Parse the user input
      async (ctx, agent) => {
        const scraped = await agent.runTool('scrapeInput', { input: ctx.userInput });
        return { ...ctx, scraped };
      },

      // Step 2: Check company registry
      async (ctx, agent) => {
        const companyRegistry = await agent.runTool('checkCompanyRegistry', {
          companyName: ctx.scraped.companyName,
        });
        return { ...ctx, companyRegistry };
      },

      // Step 3: Check domain (only if a URL was provided)
      async (ctx, agent) => {
        const domainData = await agent.runTool('checkDomain', {
          url: ctx.scraped.url,
        });
        return { ...ctx, domainData };
      },

      // Step 4: Detect scam patterns in the raw content
      async (ctx, agent) => {
        const patternResult = await agent.runTool('detectScamPatterns', {
          text: ctx.scraped.rawContent,
        });
        return { ...ctx, patternResult };
      },
    ],
  });
}

module.exports = { createScamDetectionAgent, createScamWorkflow };
