const { Tool } = require('../agent/tinyfish');

/**
 * checkDomain - Simulates a WHOIS / domain intelligence lookup.
 * Returns domain age estimation and suspicious signals.
 */

// Known legitimate domains
const KNOWN_LEGIT_DOMAINS = [
  'dbs.com', 'ocbc.com', 'uob.com', 'singtel.com', 'grab.com',
  'shopee.sg', 'lazada.sg', 'gov.sg', 'iras.gov.sg', 'mom.gov.sg',
  'google.com', 'facebook.com', 'linkedin.com', 'indeed.com',
];

// Patterns that suggest a suspicious domain
const SUSPICIOUS_PATTERNS = [
  /\d{4,}/, // Long number sequences
  /-{2,}/, // Multiple hyphens
  /secure.*login/i,
  /verify.*account/i,
  /update.*info/i,
  /free.*money/i,
  /earn.*fast/i,
  /\.xyz$/, /\.top$/, /\.click$/, /\.gq$/, /\.tk$/, /\.ml$/, /\.ga$/,
  /[a-z]+-[a-z]+-[a-z]+\./i, // three-word-hyphenated domains
];

const checkDomain = new Tool({
  name: 'checkDomain',
  description: 'Look up domain age and detect suspicious domain signals.',
  execute: async ({ url }) => {
    if (!url) {
      return {
        domain: null,
        domainAgeDays: null,
        recentlyCreated: null,
        suspicious: false,
        notes: 'No URL provided — domain check skipped.',
      };
    }

    const rawDomain = url
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .toLowerCase();
    const domain = rawDomain.replace(/^www\./, '');

    // Check against known legit list
    const isKnownLegit = KNOWN_LEGIT_DOMAINS.some(
      (d) => domain === d || domain.endsWith('.' + d)
    );

    if (isKnownLegit) {
      return {
        domain,
        domainAgeDays: Math.floor(Math.random() * 3000) + 2000, // 5–10 years
        recentlyCreated: false,
        suspicious: false,
        notes: `${domain} is a well-established, known-legitimate domain.`,
      };
    }

    // Check suspicious patterns
    const matchedPatterns = SUSPICIOUS_PATTERNS.filter((p) => p.test(domain));
    const hasSuspiciousPattern = matchedPatterns.length > 0;

    // Simulate domain age — suspicious domains tend to be newer
    const domainAgeDays = hasSuspiciousPattern
      ? Math.floor(Math.random() * 90) + 1   // 1–90 days (new)
      : Math.floor(Math.random() * 1000) + 90; // 90 days – 3 years

    const recentlyCreated = domainAgeDays < 180;
    const suspicious = hasSuspiciousPattern || recentlyCreated;

    const notes = [];
    if (recentlyCreated) notes.push(`Domain registered only ~${domainAgeDays} days ago.`);
    if (hasSuspiciousPattern) notes.push('Domain contains suspicious naming patterns.');
    if (!notes.length) notes.push('Domain appears normal but is not in the known-legitimate list.');

    return {
      domain,
      domainAgeDays,
      recentlyCreated,
      suspicious,
      notes: notes.join(' '),
    };
  },
});

module.exports = checkDomain;
