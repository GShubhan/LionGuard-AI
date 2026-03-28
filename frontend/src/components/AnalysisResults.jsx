import React, { useState } from 'react';
import './AnalysisResults.css';

const VERDICT_CONFIG = {
  Legit: {
    color: 'green',
    icon: '✅',
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)',
    textColor: '#4ade80',
    label: 'Legit',
  },
  Risky: {
    color: 'yellow',
    icon: '⚠️',
    bg: 'rgba(234, 179, 8, 0.1)',
    border: 'rgba(234, 179, 8, 0.3)',
    textColor: '#facc15',
    label: 'Risky',
  },
  'Likely Scam': {
    color: 'red',
    icon: '🚨',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    textColor: '#f87171',
    label: 'Likely Scam',
  },
};

function ConfidenceBar({ value }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color =
    clampedValue >= 75
      ? '#f87171'
      : clampedValue >= 50
      ? '#facc15'
      : '#4ade80';

  return (
    <div className="confidence-bar-wrapper">
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ width: `${clampedValue}%`, background: color }}
        />
      </div>
      <span className="confidence-value" style={{ color }}>
        {clampedValue}%
      </span>
    </div>
  );
}

function AnalysisResults({ result, onReset }) {
  const [showTrace, setShowTrace] = useState(false);
  const verdict = result?.verdict || 'Risky';
  const cfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG['Risky'];

  const redFlags = result?.red_flags || [];
  const evidence = result?.evidence || [];
  const reasoning = result?.reasoning || '';
  const confidence = result?.confidence ?? 50;
  const steps = result?.steps || [];

  return (
    <div className="results-wrapper">
      {/* Verdict Banner */}
      <div
        className="verdict-banner"
        style={{ background: cfg.bg, borderColor: cfg.border }}
      >
        <div className="verdict-icon">{cfg.icon}</div>
        <div className="verdict-info">
          <p className="verdict-label">Verdict</p>
          <h2 className="verdict-text" style={{ color: cfg.textColor }}>
            {cfg.label}
          </h2>
        </div>
        <div className="confidence-section">
          <p className="confidence-label">Confidence</p>
          <ConfidenceBar value={confidence} />
        </div>
      </div>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <section className="results-section">
          <h3 className="section-title">
            <span className="section-icon">🚩</span> Red Flags
          </h3>
          <ul className="flag-list">
            {redFlags.map((flag, i) => (
              <li key={i} className="flag-item">
                <span className="flag-bullet">▸</span>
                {flag}
              </li>
            ))}
          </ul>
        </section>
      )}

      {redFlags.length === 0 && (
        <section className="results-section">
          <h3 className="section-title">
            <span className="section-icon">🚩</span> Red Flags
          </h3>
          <p className="no-flags">No significant red flags detected.</p>
        </section>
      )}

      {/* Evidence */}
      {evidence.length > 0 && (
        <section className="results-section">
          <h3 className="section-title">
            <span className="section-icon">🔬</span> Evidence
          </h3>
          <ul className="evidence-list">
            {evidence.map((item, i) => (
              <li key={i} className="evidence-item">
                <span className="evidence-index">{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reasoning */}
      {reasoning && (
        <section className="results-section">
          <h3 className="section-title">
            <span className="section-icon">🧠</span> AI Reasoning
          </h3>
          <p className="reasoning-text">{reasoning}</p>
        </section>
      )}

      {/* Agent Trace (collapsible) */}
      {steps.length > 0 && (
        <section className="results-section trace-section">
          <button
            className="trace-toggle"
            onClick={() => setShowTrace(!showTrace)}
            type="button"
          >
            <span className="section-icon">🔧</span>
            Agent Tool Trace
            <span className="trace-chevron">{showTrace ? '▲' : '▼'}</span>
          </button>
          {showTrace && (
            <div className="trace-list">
              {steps
                .filter((s) => s.status === 'done')
                .map((s, i) => (
                  <div key={i} className="trace-item">
                    <div className="trace-tool">
                      <span className="trace-dot" />
                      {s.tool}
                    </div>
                    <pre className="trace-result">
                      {JSON.stringify(s.result, null, 2)}
                    </pre>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      {/* Actions */}
      <div className="results-actions">
        <button className="btn-primary" onClick={onReset}>
          ← Analyze Another
        </button>
        <a
          href="https://www.scamshield.org.sg/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Report to ScamShield ↗
        </a>
      </div>
    </div>
  );
}

export default AnalysisResults;
