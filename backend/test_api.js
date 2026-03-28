const axios = require('axios');

async function test() {
  console.log("Testing /analyze with https://amazon.com...");
  try {
    const res = await axios.post('http://localhost:3001/analyze', {
      input: 'https://amazon.com'
    });
    console.log("✅ REQUEST SUCCESSFUL");
    console.log("---");
    console.log("VERDICT:", res.data.verdict);
    console.log("REASONING:", res.data.reasoning);
    console.log("---");
    const scrapeStep = res.data.steps.find(s => s.tool === 'scrapeInput');
    console.log(JSON.stringify(scrapeStep.result, null, 2));
  } catch(err) {
    console.error("❌ ERROR:", err.message);
    if(err.response) console.error(err.response.data);
  }
}
test();
