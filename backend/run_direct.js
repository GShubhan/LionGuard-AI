const { createScamDetectionAgent, createScamWorkflow } = require('./agent/scamDetectionAgent');
const OpenAI = require('openai');
require('dotenv').config();

async function runDirectTest() {
  console.log("Starting direct test for sbcc.sdsc.edu...");
  try {
    const input = 'https://sbcc.sdsc.edu/main-page.html';
    const steps = [];
    const agent = createScamDetectionAgent({
      onStep: (step) => {
        console.log(`Step completed: ${step.tool}`);
        steps.push(step);
      },
    });

    console.log("Running workflow...");
    const workflow = createScamWorkflow(agent);
    const context = await workflow.run({ userInput: input });

    console.log("Workflow finished. Context keys:", Object.keys(context));
    const { scraped, companyRegistry, domainData, patternResult } = context;

    console.log("Building evidence summary...");
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
    console.log("Evidence summary built.");

    console.log("Calling OpenAI...");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a bot. Return JSON: {"verdict":"Risky","confidence":50,"red_flags":[],"evidence":[],"reasoning":""}' },
        { role: 'user', content: JSON.stringify(evidenceSummary).slice(0, 3000) }
      ],
    });

    console.log("OpenAI returned successfully.");
    console.log(completion.choices[0].message.content);
  } catch (err) {
    console.error("FAILED DIRECT TEST!");
    console.error(err);
  }
}
runDirectTest();
