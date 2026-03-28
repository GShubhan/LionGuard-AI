import React, { useState } from 'react';
import './InputForm.css';

const EXAMPLES = [
  {
    label: '🔗 Suspicious URL',
    value: 'https://secure-dbs-verify-account.xyz/login',
  },
  {
    label: '💼 Job Posting',
    value:
      'HIRING NOW! Work from home, earn $500/day, no experience needed. Just pay a $200 registration fee to get started. Limited spots remaining — respond immediately!',
  },
  {
    label: '💰 Investment Offer',
    value:
      'Exclusive crypto investment opportunity. Guaranteed 30% returns per month. Risk-free. Send USDT to get started. Act now before slots are full!',
  },
  {
    label: '📱 Suspicious Message',
    value:
      "Dear customer, your IRAS tax refund of $1,200 is ready. Please verify your NRIC and bank account details to claim. This offer expires tonight.",
  },
];

function InputForm({ onAnalyze }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) onAnalyze(input.trim());
  };

  const loadExample = (value) => {
    setInput(value);
  };

  return (
    <div className="input-form-wrapper">
      <div className="hero">
        <h2 className="hero-title">Detect Scams Instantly</h2>
        <p className="hero-desc">
          Paste a URL, job posting, investment offer, or suspicious message.
          Our AI agent investigates and gives you a clear verdict.
        </p>
      </div>

      <form className="input-card" onSubmit={handleSubmit}>
        <label className="input-label" htmlFor="userInput">
          Paste URL or suspicious content
        </label>
        <textarea
          id="userInput"
          className="input-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. https://suspicious-link.xyz&#10;or paste a job posting / message..."
          rows={6}
          autoFocus
        />
        <button
          type="submit"
          className="btn-primary analyze-btn"
          disabled={!input.trim()}
        >
          🔍 Analyze for Scams
        </button>
      </form>

      <div className="examples-section">
        <p className="examples-label">Try an example:</p>
        <div className="examples-grid">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              className="example-btn"
              onClick={() => loadExample(ex.value)}
              type="button"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InputForm;
