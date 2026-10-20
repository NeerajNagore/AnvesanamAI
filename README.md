# ANVEṢAṆAM AI

**ANVEṢAṆAM AI** is a personalized AI research, news intelligence, and weather agent web application. It combines real-time multi-source research, streaming AI synthesis with verifiable source citations, live categorized news feeds, and live weather forecasting with a modern glassmorphic interface.

**Target Repository**: `https://github.com/NeerajNagore/AnvesanamAI.git`

---

## 1. Overview & Verified Features

- **Dashboard**: Unified hub showing live weather summaries, top categorized news headlines, quick search actions, and saved research reports.
- **Streaming Research Chat**: Multi-turn conversational intelligence using Groq / xAI LLMs (`llama-3.3-70b-versatile`), automated query-dependent web search via Tavily, live token streaming with citations (`[1]`, `[2]`), and dynamically generated follow-up prompts.
- **Deep Research Engine**: Multi-stage automated web investigation (`Searching the web` → `Reading sources` → `Analysing evidence` → `Writing summary`) with customizable research depths (`quick`, `standard`, `deep`) producing structured markdown reports with key findings and source cards.
- **News Intelligence**: Live categorized headlines (Technology, Business, Science, Health, Sports, World, Entertainment) powered by GNews / NewsAPI with automated fallback to Tavily News Search.
- **Live Weather**: Real-time conditions, 24-hour hourly forecasts, and 7-day extended forecasts powered by Open-Meteo (keyless, geocoded).
- **Integrations Hub**: In-app management interface for checking integration statuses, securely setting API credentials, and running end-to-end diagnostic connectivity tests without leaking secrets.
- **Data Privacy & Export**: Zero secrets stored in client browser; local storage holds strictly client preferences, chat sessions, and saved reports with JSON export/import.
- **Multilingual Support**: Fully localized greeting, navigation, and LLM output in English, Hindi (हिन्दी), Spanish, French, German, and Japanese.

---

## 2. Architecture & Deployment Models

ANVEṢAṆAM AI is built as a dual-engine production system:

### A. Vercel Serverless Architecture (Default for Vercel Deployments)

```text
[ Vercel Edge / CDN ]
       ├── Static SPA: / (serves Vite build from dist/ with SPA rewrites)
       └── Serverless API: /api/* (routes to api/*.ts functions)
                 ├── /api/chat/stream ──► Groq API (Streaming SSE tokens)
                 ├── /api/research    ──► Tavily + Groq JSON synthesis
                 ├── /api/news        ──► GNews / NewsAPI / Tavily
                 ├── /api/weather     ──► Open-Meteo (Keyless)
                 └── /api/integrations ─► Provider diagnostics
```

- When deployed on Vercel, the application executes **100% natively** without requiring external servers.
- `vercel.json` provides seamless SPA routing fallbacks for `/chat`, `/research`, `/news`, `/weather`, `/settings` so page refreshes never 404.

### B. Standalone Container / Local Architecture (FastAPI Backend)

```text
[ React 18 + Vite Frontend (Port 5173) ]
                   │
                   │ /api/* (Dev Proxy)
                   ▼
[ FastAPI Backend (Port 8000) ] ───────────┬──► Groq / xAI API
   ├── Routers: chat, research, news,      ├──► Tavily API
   │            weather, integrations      ├──► GNews / NewsAPI
   └── Store: .data/keys.json or .env      └──► Open-Meteo API
```

- Run locally using Python uvicorn or containerized via `nexus_backend/Dockerfile` on Google Cloud Run, AWS ECS, or Render.

---

## 3. Project Directory Structure

```text
.
├── api/                               # Vercel Serverless Functions
│   ├── _lib/                          # Serverless helpers (config, llm, tavily, news, weather)
│   ├── chat/
│   │   └── stream.ts                  # Real-time SSE streaming chat endpoint
│   ├── integrations/
│   │   ├── index.ts                   # Provider status listing
│   │   ├── [id].ts                    # Save/remove integration keys
│   │   └── [id]/test.ts               # Test integration connectivity
│   ├── health.ts                      # Liveness probe
│   ├── news.ts                        # Categorized news endpoint
│   ├── research.ts                    # Deep multi-source research report generator
│   └── weather.ts                     # Live weather & forecast endpoint
├── src/                               # Frontend source (React 18 + TypeScript)
│   ├── components/layout/             # AppLayout, Navbar, Sidebar
│   ├── components/shared/             # Backgrounds, NewsCard, SourceCard, ReportView
│   ├── components/ui/                 # Radix UI primitives (Dialog, Button, Tabs, etc.)
│   ├── context/                       # AppContext (settings, reports, toasts)
│   ├── hooks/                         # useAsync, useDebounce, useLocalStorage
│   ├── lib/                           # api.ts (API client), demo.ts, utils.ts
│   ├── pages/                         # Dashboard, Chat, Research, News, Weather, etc.
│   └── types/                         # TypeScript interfaces and contracts
├── nexus_backend/                     # Python FastAPI Backend (for Local/Docker/Cloud Run)
│   ├── app/                           # routers, services, config, main.py
│   ├── Dockerfile                     # Production container image
│   ├── requirements.txt               # Python package dependencies
│   └── .env.example                   # Backend environment template
├── vercel.json                        # Vercel configuration (Vite preset + SPA & API rewrites)
├── .env.example                       # Frontend environment template
├── package.json                       # Frontend manifest (anveshanam-ai)
├── tsconfig.json                      # TypeScript configuration
└── vite.config.ts                     # Vite build and proxy configuration
```

---

## 4. Prerequisites & Environment Variables

### Environment Variables on Vercel

In your Vercel Project Settings (under **Settings** ➔ **Environment Variables**), configure:

| Variable | Required | Description | Where to Obtain |
|---|---|---|---|
| `GROQ_API_KEY` | Recommended | Fast LLM inference for chat and deep synthesis | [console.groq.com/keys](https://console.groq.com/keys) |
| `GROQ_MODEL` | Optional | Model identifier (defaults to `openai/gpt-oss-120b` with auto-fallback to `openai/gpt-oss-20b`, `llama-3.3-70b-versatile`) | Groq Documentation |
| `TAVILY_API_KEY` | Recommended | Live web search grounding and citations | [app.tavily.com](https://app.tavily.com) |
| `NEWSAPI_KEY` | Optional | GNews or NewsAPI.org key for headlines | [gnews.io](https://gnews.io) or [newsapi.org](https://newsapi.org) |
| `NEWS_COUNTRY` | Optional | Default country for headlines (default: `in`) | ISO country code |

*\*Note: Weather uses Open-Meteo, which is keyless and works immediately out of the box without any keys!*

---

## 5. Deploying to Vercel (Step-by-Step)

1. **Push your code to GitHub**:
   Ensure your code is pushed to your GitHub repository:
   `https://github.com/NeerajNagore/AnvesanamAI.git`

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New..."** ➔ **"Project"**.
   - Select your GitHub repository **`AnvesanamAI`**.
   - Vercel automatically detects the framework as **Vite**.
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `npm run build` (or leave default).
   - **Output Directory**: `dist` (or leave default).

3. **Add Environment Variables**:
   Under **Environment Variables**, add:
   - `GROQ_API_KEY` = your Groq API key
   - `TAVILY_API_KEY` = your Tavily API key
   - `NEWSAPI_KEY` = your GNews or NewsAPI key (optional)

4. **Deploy**:
   Click **Deploy**.
   Vercel will:
   - Build the Vite static assets into `dist/`.
   - Deploy `api/` as Serverless Functions.
   - Activate the SPA rewrites configured in `vercel.json`.

---

## 6. Local Development

### Option A: Local Full-Stack with Python Backend
```powershell
# Terminal 1: Backend
cd nexus_backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Frontend
npm run dev
# Open http://localhost:5173
```

### Option B: Local Development with Vercel CLI
```powershell
npx vercel dev
# Simulates both Vite frontend and Vercel Serverless Functions on http://localhost:3000
```

---

## 7. Verification & Build Commands

```powershell
# TypeScript Typecheck
npm run typecheck

# Production Build
npm run build
```

---

## 8. Security & Privacy

1. **No Client-Side Secret Leakage**: All private provider keys (`GROQ_API_KEY`, `TAVILY_API_KEY`, `NEWSAPI_KEY`) run strictly server-side in the Vercel Serverless environment or FastAPI backend. They are never exposed to browser client bundles or public `VITE_` variables.
2. **Safe Key Management**: Diagnostic endpoints and test functions never return raw secret values.
3. **Protected Environment**: Real `.env` files and `.data/` directory are excluded from Git via `.gitignore`.
