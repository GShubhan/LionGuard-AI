const { Tool } = require('../agent/tinyfish');
const axios = require('axios');

/**
 * scrapeInput - Extracts structured data from a URL or raw text.
 * If the input is a URL: uses the TinyFish Web Agent API to actually browse the page.
 * For plain text: returns it as-is and attempts to extract key claims.
 */

const TINYFISH_API_URL = 'https://agent.tinyfish.ai/v1/automation/run-sse';

/**
 * Call the TinyFish Web Agent to browse a URL and extract content.
 * Streams SSE events and returns the final result.
 */
async function browsWithTinyFish(url) {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey || apiKey === 'your_tinyfish_api_key_here') {
    return null; // No key — will fall back to mock
  }

  try {
    const response = await axios.post(
      TINYFISH_API_URL,
      {
        url: url,
        goal: `Visit this website and extract the following information in detail:
1. The company or organization name behind this site
2. What the site is offering (job, investment, product, service, etc.)
3. All key claims and promises made on the page
4. Any pricing, salary, or financial figures mentioned
5. Any urgency language or pressure tactics
6. Any requests for personal information or payments
7. The full visible text content of the page

Return all findings as a detailed text summary.`,
        proxy_config: { enabled: false },
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 60000, // 60 second timeout
      }
    );

    // Parse SSE stream to get the final result
    return new Promise((resolve) => {
      let fullContent = '';
      let lastResult = '';

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              // Capture any result/output from the event
              if (event.result) {
                lastResult = typeof event.result === 'string'
                  ? event.result
                  : JSON.stringify(event.result);
              }
              if (event.output) {
                lastResult = typeof event.output === 'string'
                  ? event.output
                  : JSON.stringify(event.output);
              }
              if (event.text) {
                fullContent += event.text + '\n';
              }
              if (event.data && event.data.result) {
                lastResult = typeof event.data.result === 'string'
                  ? event.data.result
                  : JSON.stringify(event.data.result);
              }
            } catch {
              // Not valid JSON, skip
            }
          }
        }
      });

      response.data.on('end', () => {
        resolve(lastResult || fullContent || null);
      });

      response.data.on('error', () => {
        resolve(null);
      });

      // Safety timeout
      setTimeout(() => resolve(lastResult || fullContent || null), 55000);
    });
  } catch (err) {
    console.error('TinyFish API error:', err.message);
    return null;
  }
}

const scrapeInput = new Tool({
  name: 'scrapeInput',
  description: 'Parse user input (URL or text) and extract company name, offer type, and key claims. Uses TinyFish Web Agent for real URL browsing.',
  execute: async ({ input }) => {
    const isUrl = /^https?:\/\//i.test(input.trim());

    if (isUrl) {
      const url = input.trim();
      const domain = url.replace(/^https?:\/\//i, '').split('/')[0];

      // Try real TinyFish browsing first
      const tinyfishResult = await browsWithTinyFish(url);

      if (tinyfishResult) {
        // We got real content from TinyFish!
        const content = tinyfishResult;

        // Try to extract company name from content
        const companyMatch = content.match(/(?:company|by|from|©|copyright)\s*:?\s*([A-Z][A-Za-z\s&.]+)/i);
        const companyName = companyMatch
          ? companyMatch[1].trim()
          : domain.replace(/^www\./i, '').split('.')[0];

        // Extract key claims (sentences with strong language)
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const claimKeywords = ['guaranteed', 'earn', 'free', 'limited', 'exclusive', 'risk', 'offer', 'salary', 'income', 'profit', 'investment', 'return', 'pay', 'job', 'work', 'opportunity'];
        const keyClaims = sentences
          .filter(s => claimKeywords.some(k => s.toLowerCase().includes(k)))
          .slice(0, 8)
          .map(s => s.trim());

        // Detect offer type
        const offerKeywords = { job: 'job posting', investment: 'investment opportunity', crypto: 'crypto/investment', salary: 'job posting', earn: 'income opportunity', loan: 'financial service' };
        let offerType = 'website/service';
        for (const [kw, type] of Object.entries(offerKeywords)) {
          if (content.toLowerCase().includes(kw)) {
            offerType = type;
            break;
          }
        }

        return {
          inputType: 'url',
          rawContent: content,
          url,
          domain,
          companyName,
          offerType,
          keyClaims: keyClaims.length > 0 ? keyClaims : ['Content extracted from live website via TinyFish'],
          source: 'tinyfish',  // Flag that this was real browsing
        };
      }

      // Fallback to mock if TinyFish unavailable
      return {
        inputType: 'url',
        rawContent: `[Simulated page content from ${url}]`,
        url,
        domain,
        companyName: domain.replace(/^www\./i, '').split('.')[0],
        offerType: 'website/service',
        keyClaims: [
          'Visit our website for exclusive offers',
          'Limited time opportunity',
          'Register now to get started',
        ],
        source: 'mock',
      };
    }

    // Plain text — try to extract company name and offer type heuristically
    const lines = input.split('\n').filter(Boolean);
    const companyMatch = input.match(/(?:company|employer|from|by)[:\s]+([A-Z][A-Za-z\s&.]+)/i);
    const companyName = companyMatch ? companyMatch[1].trim() : 'Unknown';

    const offerKeywords = ['job', 'investment', 'return', 'earn', 'salary', 'opportunity', 'crypto'];
    const detectedOffer = offerKeywords.find((k) => input.toLowerCase().includes(k)) || 'general';

    return {
      inputType: 'text',
      rawContent: input,
      url: null,
      domain: null,
      companyName,
      offerType: detectedOffer,
      keyClaims: lines.slice(0, 5),
      source: 'text',
    };
  },
});

module.exports = scrapeInput;
