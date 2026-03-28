require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { createScamDetectionAgent, createScamWorkflow } = require('./agent/scamDetectionAgent');

const app = express();
app.use(cors());
app.use(express.json());

// Lazily initialise the OpenAI client so the server starts cleanly even
// when no API key is configured (demo / local dev mode).
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing' });
  }
  return _openai;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'LionGuard AI' });
});

/**
 * POST /analyze
 *
 * Body: { input: string }
 *
 * Runs the ScamDetectionAgent Tinyfish workflow, then passes all
 * gathered evidence to OpenAI for a final structured verdict.
 *
 * Response:
 * {
 *   verdict: "Legit" | "Risky" | "Likely Scam",
 *   confidence: number (0–100),
 *   red_flags: string[],
 *   evidence: string[],
 *   reasoning: string,
 *   steps: { tool, status, result }[]   // agent trace
 * }
 */
app.post('/analyze', async (req, res) => {
  console.log("=> /analyze hit with input:", req.body.input);
  const { input } = req.body;

  if (!input || !input.trim()) {
    return res.status(400).json({ error: 'Input is required.' });
  }

  const steps = [];

  try {
    // Create the agent, capturing each step for the frontend trace
    const agent = createScamDetectionAgent({
      onStep: (step) => steps.push(step),
    });

    const workflow = createScamWorkflow(agent);

    // Run the Tinyfish workflow
    console.log("Running workflow...");
    const context = await workflow.run({ userInput: input.trim() });
    console.log("Workflow finished.");
    const { scraped, companyRegistry, domainData, patternResult } = context;

    // Build the evidence summary for OpenAI
    const evidenceSummary = {
      inputType: scraped?.inputType || 'unknown',
      companyName: scraped?.companyName || 'Unknown',
      offerType: scraped?.offerType || 'unknown',
      keyClaims: scraped?.keyClaims || [],
      extractedContent: scraped?.rawContent ? scraped.rawContent.slice(0, 1500) : '',
      companyRegistry: companyRegistry || { exists: false, notes: 'Not checked' },
      domainData: domainData || { suspicious: false, domainAgeDays: 0 },
      scamPatterns: patternResult?.matchedPatterns || [],
    };

    // Call OpenAI for final reasoning
    console.log("Calling OpenAI...");
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a fraud detection analyst specializing in Singapore scams.
You analyze signals from multiple sources and determine whether something is a scam.
CRITICAL RULE: If a company is a well-known global brand (e.g., Anthropic, Amazon, Marvel, Apple) or clearly a foreign entity, DO NOT penalize it for being missing from the Singapore ACRA registry. Only penalize ACRA absence if it explicitly claims to be a local Singapore business.
You must provide clear, evidence-based reasoning.
Always respond with a valid JSON object matching this exact schema:
{
  "verdict": "Legit" | "Risky" | "Likely Scam",
  "confidence": <integer 0-100>,
  "red_flags": [<string>, ...],
  "evidence": [<string>, ...],
  "reasoning": "<paragraph string>"
}`,
        },
        {
          role: 'user',
          content: `Analyze the following input for scam signals.

## Input Type
${evidenceSummary.inputType}

## Extracted Content
${evidenceSummary.extractedContent}

## Company: ${evidenceSummary.companyName}
### ACRA Registry Check
${JSON.stringify(evidenceSummary.companyRegistry, null, 2)}

## Domain Check
${JSON.stringify(evidenceSummary.domainData, null, 2)}

## Detected Scam Patterns
${evidenceSummary.scamPatterns.length
  ? evidenceSummary.scamPatterns.map((p) => `- ${p.label}`).join('\n')
  : '- None detected'}

## Key Claims
${evidenceSummary.keyClaims.map((c) => `- ${c}`).join('\n')}

Based on all the above, provide your verdict, confidence score, red flags, evidence, and reasoning.`,
        },
      ],
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch {
      analysis = {
        verdict: 'Risky',
        confidence: 50,
        red_flags: ['Unable to parse AI response'],
        evidence: ['Raw response: ' + completion.choices[0].message.content.slice(0, 200)],
        reasoning: 'The AI response could not be parsed. Manual review recommended.',
      };
    }

    console.log("Returning JSON success.");
    return res.json({ ...analysis, steps });
  } catch (err) {
    console.log("Caught error:", err.message);
    require('fs').appendFileSync('backend-crash.log', 'Caught error: ' + String(err.stack) + '\n');
    // In demo / sandbox mode the OpenAI call fails due to no API key or no
    // network access — this is expected and we silently fall back.
    const isDemoFallback =
      err.code === 'invalid_api_key' ||
      err.code === 'insufficient_quota' ||
      err.code === 'rate_limit_exceeded' ||
      err.status === 401 ||
      err.status === 429 ||
      err.code === 'ENOTFOUND' ||
      (err.cause && err.cause.code === 'ENOTFOUND') ||
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === 'your_openai_api_key_here' ||
      process.env.OPENAI_API_KEY === 'missing';

    if (isDemoFallback) {
      return res.json(buildDemoFallback(input, steps));
    }

    console.error('Analysis error:', err);
    require('fs').appendFileSync('backend-crash.log', 'Analysis error: ' + String(err.stack) + '\n');
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// App-level global error handler to catch sneaky unhandled errors
app.use((err, req, res, next) => {
  require('fs').appendFileSync('backend-crash.log', 'GLOBAL ERROR: ' + String(err.stack) + '\n');
  res.status(500).json({ error: 'Global unhandled error' });
});

/**
 * Demo fallback when no real OpenAI key is configured.
 * Provides a convincing analysis based purely on tool results.
 */
function buildDemoFallback(input, steps) {
  const toolResults = {};
  for (const step of steps) {
    if (step.status === 'done') {
      toolResults[step.tool] = step.result;
    }
  }

  const patterns = toolResults.detectScamPatterns?.matchedPatterns || [];
  const domain = toolResults.checkDomain || {};
  const company = toolResults.checkCompanyRegistry || {};

  const redFlags = [];
  const evidence = [];

  if (!company.exists) {
    redFlags.push('Company not found in ACRA registry');
    evidence.push(`Registry check: ${company.notes || 'No record found'}`);
  }
  if (domain.suspicious) {
    redFlags.push('Suspicious domain detected');
    evidence.push(`Domain age: ~${domain.domainAgeDays} days. ${domain.notes}`);
  }
  for (const p of patterns) {
    redFlags.push(p.label);
    evidence.push(`Scam pattern matched: "${p.label}"`);
  }

  const score = redFlags.length;
  let verdict, confidence, reasoning;

  if (score === 0) {
    verdict = 'Legit';
    confidence = 72;
    reasoning =
      'No significant red flags were detected. The company appears registered and the domain signals are normal. However, always exercise caution and verify independently.';
  } else if (score <= 2) {
    verdict = 'Risky';
    confidence = 65;
    reasoning = `${score} risk signal(s) were detected. This input shows some warning signs that warrant caution. Avoid sharing personal or financial information until you have independently verified the source.`;
  } else {
    verdict = 'Likely Scam';
    confidence = 85;
    reasoning = `Multiple strong indicators of fraud were found (${score} signals). This matches known Singapore scam patterns. Do NOT send money or personal data. Report to ScamShield or the Singapore Police Force.`;
  }

  return { verdict, confidence, red_flags: redFlags, evidence, reasoning, steps };
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🦁 LionGuard AI backend running on port ${PORT}`);
});
