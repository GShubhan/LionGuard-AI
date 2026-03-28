# LionGuard AI

AI-powered scam detection agent built with a Tinyfish-style agent orchestration layer and OpenAI.

## Architecture

```
LionGuard-AI/
├── backend/          # Node.js + Express API
│   ├── agent/
│   │   ├── tinyfish.js           # Agent orchestration framework
│   │   └── scamDetectionAgent.js # Agent + workflow definition
│   ├── tools/
│   │   ├── scrapeInput.js        # Parse URL or text input
│   │   ├── checkCompanyRegistry.js # Simulated ACRA lookup
│   │   ├── checkDomain.js        # Simulated WHOIS/domain check
│   │   └── detectScamPatterns.js # Linguistic scam pattern detection
│   ├── server.js     # Express server + POST /analyze
│   └── .env.example
└── frontend/         # React app
    └── src/
        ├── App.jsx
        └── components/
            ├── InputForm.jsx
            ├── LoadingStates.jsx
            └── AnalysisResults.jsx
```

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm start
```

The backend runs on `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

The React app runs on `http://localhost:3000` and proxies `/analyze` to the backend.

## API

### POST /analyze

**Request:**
```json
{ "input": "<URL or suspicious text>" }
```

**Response:**
```json
{
  "verdict": "Legit | Risky | Likely Scam",
  "confidence": 85,
  "red_flags": ["..."],
  "evidence": ["..."],
  "reasoning": "...",
  "steps": [...]
}
```

## Notes

- External APIs (ACRA, WHOIS) are **simulated** for the MVP.
- The app falls back to rule-based analysis if no OpenAI API key is configured.
- Set `OPENAI_API_KEY` in `backend/.env` for full AI-powered verdicts.
