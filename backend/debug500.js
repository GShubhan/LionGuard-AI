const axios = require('axios');

async function debug500() {
  console.log("Debugging 500 error...");
  try {
    const res = await axios.post('http://localhost:3002/analyze', {
      input: 'https://sbcc.sdsc.edu/main-page.html'
    });
    console.log("SUCCESS");
  } catch (err) {
    console.error("FAILED! Status:", err.response?.status);
    console.error("Error data:", JSON.stringify(err.response?.data, null, 2));
  }
}
debug500();
