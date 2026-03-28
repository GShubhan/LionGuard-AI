const { Tool } = require('../agent/tinyfish');

/**
 * detectScamPatterns - Scans text for known scam linguistic patterns
 * commonly found in Singapore-context fraud.
 */

const SCAM_PATTERNS = [
  // Upfront payment demands
  {
    id: 'upfront_payment',
    label: 'Upfront Payment Required',
    patterns: [
      /(?:pay|deposit|transfer|send)\s+(?:first|upfront|advance|now)/i,
      /upfront\s+(?:fee|payment|deposit|cost)/i,
      /registration\s+fee/i,
      /(?:admin|processing|activation)\s+fee/i,
    ],
  },
  // Guaranteed / unrealistic returns
  {
    id: 'guaranteed_returns',
    label: 'Guaranteed or Unrealistic Returns',
    patterns: [
      /guaranteed\s+(?:returns?|profit|income|earnings?)/i,
      /\d{2,3}%\s+(?:return|profit|roi|interest)\s+(?:per|a|every)/i,
      /risk.free\s+investment/i,
      /double\s+your\s+(?:money|investment)/i,
      /no\s+risk/i,
    ],
  },
  // Urgency / pressure tactics
  {
    id: 'urgency',
    label: 'Urgency / Pressure Tactics',
    patterns: [
      /(?:limited|last\s+few)\s+(?:spots?|slots?|seats?|positions?)/i,
      /(?:act|respond|apply|register)\s+(?:now|immediately|today|fast|quickly)/i,
      /offer\s+(?:expires?|ends?|closes?)\s+(?:soon|today|tonight)/i,
      /don'?t\s+miss\s+(?:this|out)/i,
      /once.in.a.lifetime/i,
    ],
  },
  // High-paying remote work
  {
    id: 'high_salary_remote',
    label: 'Suspiciously High Salary / Remote Work',
    patterns: [
      /(?:earn|make|get)\s+\$?\d+[,k]?\s*(?:per\s+day|a\s+day|daily)/i,
      /work\s+from\s+home.*\$?\d{4,}/i,
      /part.?time.*\$?\d{3,}\s*(?:per\s+day|daily)/i,
      /no\s+experience\s+(?:needed|required|necessary)/i,
      /\$\d{4,}\s*(?:\/|\s+per\s+)(?:week|month|day)/i,
    ],
  },
  // Personal / banking info requests
  {
    id: 'personal_info_request',
    label: 'Requests for Personal / Banking Information',
    patterns: [
      /(?:bank\s+account|credit\s+card)\s+(?:number|details|info)/i,
      /(?:share|send|provide)\s+your\s+(?:nric|ic|passport|singpass)/i,
      /verify\s+your\s+(?:identity|account|details)/i,
      /(?:login|password)\s+credentials/i,
    ],
  },
  // Crypto / investment schemes
  {
    id: 'crypto_investment',
    label: 'Crypto or Unregulated Investment Scheme',
    patterns: [
      /(?:bitcoin|btc|ethereum|eth|usdt|crypto)\s+(?:investment|trading|profit)/i,
      /(?:forex|fx)\s+(?:trading|signal|profit)/i,
      /binary\s+options?/i,
      /(?:invest|put\s+in)\s+(?:as\s+little\s+as\s+)?\$\d+/i,
      /(?:mlm|multi.?level\s+marketing|pyramid)/i,
    ],
  },
  // Impersonation signals
  {
    id: 'impersonation',
    label: 'Possible Impersonation',
    patterns: [
      /(?:iras|mom|moh|police|spf|mas)\s+(?:officer|agent|representative)/i,
      /(?:bank|dbs|ocbc|uob|posb)\s+(?:security|fraud)\s+(?:team|department)/i,
      /(?:microsoft|apple|google)\s+(?:support|team|helpdesk)/i,
      /government\s+(?:grant|subsidy|voucher)/i,
    ],
  },
];

const detectScamPatterns = new Tool({
  name: 'detectScamPatterns',
  description: 'Scan text for known scam linguistic patterns used in Singapore fraud cases.',
  execute: async ({ text }) => {
    if (!text) {
      return { matchedPatterns: [] };
    }

    const matched = [];

    for (const category of SCAM_PATTERNS) {
      const hit = category.patterns.some((p) => p.test(text));
      if (hit) {
        matched.push({
          id: category.id,
          label: category.label,
        });
      }
    }

    return { matchedPatterns: matched };
  },
});

module.exports = detectScamPatterns;
