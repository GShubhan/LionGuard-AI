const { Tool } = require('../agent/tinyfish');

/**
 * scrapeInput - Extracts structured data from a URL or raw text.
 * If the input looks like a URL, simulates fetching its content.
 * For plain text, returns it as-is and attempts to extract key claims.
 */
const scrapeInput = new Tool({
  name: 'scrapeInput',
  description: 'Parse user input (URL or text) and extract company name, offer type, and key claims.',
  execute: async ({ input }) => {
    const isUrl = /^https?:\/\//i.test(input.trim());

    if (isUrl) {
      // In production this would use axios to fetch and cheerio to parse.
      // For MVP we simulate the scrape with mock extracted data.
      const url = input.trim();
      const domain = url.replace(/^https?:\/\//i, '').split('/')[0];

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
    };
  },
});

module.exports = scrapeInput;
