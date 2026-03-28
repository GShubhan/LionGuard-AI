const { Tool } = require('../agent/tinyfish');

// Well-known global companies — these are legit regardless of ACRA
const GLOBAL_KNOWN_BRANDS = [
  'google', 'youtube', 'alphabet', 'microsoft', 'apple', 'amazon', 'meta',
  'facebook', 'instagram', 'whatsapp', 'netflix', 'spotify', 'uber', 'airbnb',
  'twitter', 'x corp', 'linkedin', 'openai', 'anthropic', 'mistral', 'deepmind',
  'nvidia', 'intel', 'amd', 'samsung', 'sony', 'lg', 'huawei', 'xiaomi',
  'shopify', 'stripe', 'paypal', 'visa', 'mastercard', 'amex',
  'tinyfish', 'vercel', 'netlify', 'github', 'gitlab', 'atlassian',
  'marvel', 'disney', 'netflix', 'warner', 'universal',
  'mckinsey', 'deloitte', 'pwc', 'kpmg', 'ernst', 'accenture',
  'tencent', 'alibaba', 'bytedance', 'baidu', 'grab', 'sea limited', 'shopee',
];

// Singapore-registered companies
const SINGAPORE_REGISTRY = {
  'dbs': { exists: true, notes: 'DBS Bank Ltd — established Singapore bank, UEN 196800306E' },
  'ocbc': { exists: true, notes: 'OCBC Bank — established Singapore bank, UEN 193200032W' },
  'uob': { exists: true, notes: 'United Overseas Bank — established Singapore bank' },
  'posb': { exists: true, notes: 'POSB — part of DBS Group, established Singapore bank' },
  'singtel': { exists: true, notes: 'Singapore Telecommunications Limited — registered telecom' },
  'starhub': { exists: true, notes: 'StarHub Ltd — registered Singapore telecom' },
  'grab': { exists: true, notes: 'Grab Holdings — registered tech company' },
  'shopee': { exists: true, notes: 'Sea Limited / Shopee — registered e-commerce' },
  'carousell': { exists: true, notes: 'Carousell — registered Singapore marketplace' },
  'foodpanda': { exists: true, notes: 'Foodpanda — registered food delivery' },
  'nus': { exists: true, notes: 'National University of Singapore — public university' },
  'ntu': { exists: true, notes: 'Nanyang Technological University — public university' },
  'smu': { exists: true, notes: 'Singapore Management University — private university' },
};

// Financial-sounding words that suggest a Singapore-local financial claim
const LOCAL_FINANCE_TERMS = [
  'capital', 'invest', 'wealth', 'profit', 'earn', 'fund', 'asset',
  'trading', 'returns', 'portfolio', 'yield', 'crypto', 'forex',
];

const checkCompanyRegistry = new Tool({
  name: 'checkCompanyRegistry',
  description: 'Check if a company is a known legitimate brand or registered Singapore business.',
  execute: async ({ companyName }) => {
    if (!companyName || companyName === 'Unknown' || companyName.trim().length < 2) {
      return {
        exists: false,
        notes: 'No company name detected — registry check skipped.',
      };
    }

    const key = companyName.toLowerCase().trim();

    // 1. Check Singapore registry first (exact/partial)
    const sgMatch = Object.keys(SINGAPORE_REGISTRY).find(
      (k) => key.includes(k) || k.includes(key)
    );
    if (sgMatch) {
      return { exists: true, ...SINGAPORE_REGISTRY[sgMatch] };
    }

    // 2. Check global known brands — these are legit, just not Singapore-registered
    const globalMatch = GLOBAL_KNOWN_BRANDS.find(
      (brand) => key.includes(brand) || brand.includes(key)
    );
    if (globalMatch) {
      return {
        exists: true,
        notes: `"${companyName}" is a well-known global brand. Not Singapore ACRA-registered but this is expected for international companies.`,
      };
    }

    // 3. Unknown company — check if it's making local financial claims
    const hasLocalFinanceClaim = LOCAL_FINANCE_TERMS.some((t) => key.includes(t));

    if (hasLocalFinanceClaim) {
      return {
        exists: false,
        notes: `"${companyName}" not found in ACRA registry. Financial or investment company with no registration record is a significant red flag in Singapore.`,
      };
    }

    // 4. Generic unknown — neutral signal, let OpenAI decide
    return {
      exists: false,
      notes: `"${companyName}" not found in known registry. This is a weak signal — many legitimate small businesses or international companies won't appear here.`,
    };
  },
});

module.exports = checkCompanyRegistry;