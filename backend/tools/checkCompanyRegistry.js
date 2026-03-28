const { Tool } = require('../agent/tinyfish');

/**
 * checkCompanyRegistry - Simulates ACRA (Accounting and Corporate Regulatory Authority)
 * company registry lookup to verify if a business is legitimately registered.
 */

// Mock registry of known companies for demonstration
const MOCK_REGISTRY = {
  'dbs': { exists: true, numberOfEmployees: 12000, notes: 'Established Singapore bank. DBS Bank Ltd, UEN 196800306E' },
  'ocbc': { exists: true, numberOfEmployees: 25000, notes: 'Legitimate Singapore bank. OCBC Bank, UEN 193200032W' },
  'singtel': { exists: true, numberOfEmployees: 23000, notes: 'Registered telecom company. Singapore Telecommunications Limited' },
  'grab': { exists: true, numberOfEmployees: 7000, notes: 'Registered tech company. Grab Holdings Inc.' },
  'shopee': { exists: true, numberOfEmployees: 5000, notes: 'Registered e-commerce company. Sea Limited' },
  'unknown': { exists: false, numberOfEmployees: 0, notes: 'Not found in ACRA registry' },
};

const checkCompanyRegistry = new Tool({
  name: 'checkCompanyRegistry',
  description: 'Verify if a company exists in the ACRA business registry (Singapore).',
  execute: async ({ companyName }) => {
    if (!companyName || companyName === 'Unknown') {
      return {
        exists: false,
        numberOfEmployees: 0,
        notes: 'No company name provided — cannot verify registration.',
      };
    }

    const key = companyName.toLowerCase().trim();

    // Check exact or partial match in mock registry
    const matched = Object.keys(MOCK_REGISTRY).find(
      (k) => key.includes(k) || k.includes(key)
    );

    if (matched) {
      return MOCK_REGISTRY[matched];
    }

    // Simulate realistic random outcomes for unknown companies
    const suspiciousTerms = ['capital', 'invest', 'wealth', 'profit', 'earn', 'crypto', 'fund', 'global'];
    const looksSuspicious = suspiciousTerms.some((t) => key.includes(t));

    if (looksSuspicious) {
      return {
        exists: false,
        numberOfEmployees: 0,
        notes: `"${companyName}" not found in ACRA registry. Financial-sounding name with no registration record.`,
      };
    }

    // Generic unknown — could be real or not
    return {
      exists: false,
      numberOfEmployees: 0,
      notes: `"${companyName}" not found in ACRA registry. Could be unregistered or operating under a different name.`,
    };
  },
});

module.exports = checkCompanyRegistry;
