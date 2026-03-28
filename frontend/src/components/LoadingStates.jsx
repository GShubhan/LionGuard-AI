import React from 'react';
import './LoadingStates.css';

function LoadingStates({ steps, currentStep }) {
  return (
    <div className="loading-wrapper">
      <div className="loading-header">
        <div className="loading-spinner" />
        <h2 className="loading-title">Investigating...</h2>
        <p className="loading-subtitle">Our AI agent is running multiple checks</p>
      </div>

      <div className="loading-steps">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div
              key={step.key}
              className={`loading-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="step-indicator">
                {isDone ? (
                  <span className="step-check">✓</span>
                ) : isActive ? (
                  <div className="step-pulse" />
                ) : (
                  <div className="step-dot" />
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LoadingStates;
