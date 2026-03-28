import React, { useState } from 'react';
import InputForm from './components/InputForm';
import LoadingStates from './components/LoadingStates';
import AnalysisResults from './components/AnalysisResults';
import './App.css';

const LOADING_STEPS = [
  { key: 'scrape', label: '🔍 Analyzing input...' },
  { key: 'registry', label: '🏢 Verifying company...' },
  { key: 'domain', label: '🌐 Checking domain...' },
  { key: 'patterns', label: '🧠 Detecting scam patterns...' },
  { key: 'ai', label: '⚡ Running AI reasoning...' },
];

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  const analyze = async (input) => {
    setResult(null);
    setError(null);
    setLoading(true);
    setCurrentStep(0);

    // Animate through loading steps while the real request runs
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 900);

    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      clearInterval(stepInterval);
      setCurrentStep(LOADING_STEPS.length - 1);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setCurrentStep(0);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🦁</span>
            <div>
              <h1 className="logo-title">LionGuard AI</h1>
              <p className="logo-subtitle">AI-Powered Scam Detection</p>
            </div>
          </div>
          <div className="header-badge">Powered by OpenAI</div>
        </div>
      </header>

      <main className="app-main">
        {!loading && !result && (
          <InputForm onAnalyze={analyze} />
        )}

        {loading && (
          <LoadingStates steps={LOADING_STEPS} currentStep={currentStep} />
        )}

        {error && !loading && (
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <p className="error-msg">{error}</p>
            <button className="btn-secondary" onClick={reset}>
              Try Again
            </button>
          </div>
        )}

        {result && !loading && (
          <AnalysisResults result={result} onReset={reset} />
        )}
      </main>

      <footer className="app-footer">
        <p>LionGuard AI · For educational use only · Always verify independently</p>
      </footer>
    </div>
  );
}

export default App;
