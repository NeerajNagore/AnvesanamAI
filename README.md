# ANVEṢAṆAM AI

**ANVEṢAṆAM AI** is a personalized AI research, news intelligence, and weather agent web application. It combines real-time multi-source research, streaming AI synthesis with verifiable source citations, live categorized news feeds, and live weather forecasting with a modern glassmorphic interface.

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

## 2. Architecture & Data Flow

```text
[ React 18 + Vite Frontend (Port 5173) ]
                   │
                   │ /api/* (Dev Proxy or Production Base URL)
                   ▼
[ FastAPI Backend (Port 8000) ] ───────────┬──► Groq / xAI API (Chat / Synthesis)
   ├── Routers: chat, research, news,      ├──► Tavily API (Search & News)
   │            weather, integrations      ├──► GNews / NewsAPI (Headlines)
   └── Store: .data/keys.json or .env      └──► Open-Meteo API (Weather / Geocoding)
```

- **Local Development Flow**: The browser sends requests to `http://localhost:5173/api/*`. Vite's development proxy routes `/api/*` to `http://127.0.0.1:8000`. The FastAPI backend handles the routes both at `/api/*` and `/*`.
- **Production Flow**: The compiled static frontend (`dist/`) connects to the deployed backend origin via `VITE_API_BASE_URL` with CORS enabled on the backend.
- **Demo Mode**: If `VITE_API_BASE_URL` is empty and no backend is reachable, the frontend seamlessly operates in demo mode for research and news, while weather continues to function via direct keyless Open-Meteo calls.

---

## 3. Project Directory Structure

```text
.
├── src/                               # Frontend source (React 18 + TypeScript)
│   ├── components/
│   │   ├── layout/                    # AppLayout, Navbar, Sidebar
│   │   ├── shared/                    # Backgrounds, NewsCard, SourceCard, ReportView
│   │   └── ui/                        # Radix UI primitives (Dialog, Button, Tabs, etc.)
│   ├── context/                       # AppContext (settings, reports, toasts)
│   ├── hooks/                         # useAsync, useDebounce, useLocalStorage
│   ├── lib/                           # api.ts (API client), demo.ts, utils.ts
│   ├── pages/                         # Dashboard, Chat, Research, News, Weather, Integrations, etc.
│   └── types/                         # TypeScript interfaces and contracts
├── nexus_backend/                     # Backend source (Python + FastAPI)
│   ├── app/
│   │   ├── routers/                   # chat.py, research.py, news.py, weather.py, integrations.py
│   │   ├── services/                  # llm.py, tavily.py, news.py, weather.py
│   │   ├── config.py                  # Environment config and language mappings
│   │   ├── errors.py                  # Standardized ServiceError exception
│   │   ├── main.py                    # FastAPI application entrypoint & CORS
│   │   ├── schemas.py                 # Pydantic request/response schemas
│   │   └── store.py                   # Secure server-side credential store
│   ├── Dockerfile                     # Production container definition
│   ├── requirements.txt               # Python package dependencies
│   └── .env.example                   # Backend environment template
├── .env.example                       # Frontend environment template
├── package.json                       # Frontend manifest (anveshanam-ai)
├── tsconfig.json                      # TypeScript configuration
└── vite.config.ts                     # Vite build and proxy configuration
```

---

## 4. Prerequisites & Runtime Versions

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Python**: v3.10 to v3.13 (Python 3.12+ recommended)
- **Git**: v2.30+

---

## 5. Installation & Local Setup

### Terminal 1: Backend (FastAPI)

```powershell
# Navigate to backend directory
cd nexus_backend

# (Optional) Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
Copy-Item .env.example .env
# Edit .env with your credentials (or enter them later via the UI Integrations page)

# Start backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend will be active at: `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`).

### Terminal 2: Frontend (Vite + React)

```powershell
# In project root
npm ci  # or npm install

# Start Vite development server
npm run dev
```

Frontend will be active at: `http://localhost:5173`.

---

## 6. Environment Variables & Credentials

### Frontend (`.env` / `.env.production`)

| Variable | Public/Secret | Description | Example |
|---|---|---|---|
| `VITE_API_BASE_URL` | Public | Base URL for API requests. In dev, `/api` uses Vite proxy. | `/api` or `https://api.yourdomain.com` |
| `VITE_BACKEND_URL` | Public (Dev only) | Target backend origin for Vite proxy. | `http://localhost:8000` |

### Backend (`nexus_backend/.env`)

| Variable | Public/Secret | Required | Description | Where to Obtain |
|---|---|---|---|---|
| `GROQ_API_KEY` | Secret | Optional* | Fast LLM inference for chat and synthesis | [console.groq.com](https://console.groq.com/keys) |
| `GROQ_MODEL` | Public | No (defaults to `llama-3.3-70b-versatile`) | Groq model selection | Groq Docs |
| `TAVILY_API_KEY` | Secret | Optional* | Real-time web search and citation indexing | [app.tavily.com](https://app.tavily.com) |
| `NEWSAPI_KEY` | Secret | Optional | GNews API key or NewsAPI.org key for headlines | [gnews.io](https://gnews.io) or [newsapi.org](https://newsapi.org) |
| `NEWS_COUNTRY` | Public | No (default: `in`) | Country code for news headlines | ISO 3166-1 alpha-2 code |
| `CORS_ORIGINS` | Public | Yes (Prod) | Comma-separated allowed frontend origins | `http://localhost:5173,https://anveshanam-ai.web.app` |
| `DATA_DIR` | Public | No (default: `.data`) | Local server directory for key storage | Local path |

*\*Note: If external keys are not provided in `.env`, they can be added directly through the application's `/integrations` interface, where keys are stored securely server-side in `.data/keys.json`.*

---

## 7. API Reference

All routes are mounted at root `/` and `/api/*`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend liveness probe. Returns `{"ok": true}`. |
| `POST` | `/chat/stream` | Server-Sent Events stream for AI chat with Tavily web grounding. |
| `POST` | `/research` | Executes multi-source web research report generation. |
| `GET` | `/news` | Returns curated news articles by category (`technology`, `business`, etc.) or search query. |
| `GET` | `/weather` | Returns current conditions, hourly, and 7-day forecast. |
| `GET` | `/integrations` | Returns integration status (indicates whether configured; never returns key contents). |
| `PUT` | `/integrations/{id}` | Securely sets provider key server-side. |
| `DELETE` | `/integrations/{id}` | Removes stored provider key. |
| `POST` | `/integrations/{id}/test` | Tests live provider connectivity and reports status. |

---

## 8. Validation Commands

```powershell
# TypeScript Typecheck
npm run typecheck

# Production Bundle Build
npm run build

# Preview Production Build locally
npm run preview
```

---

## 9. Troubleshooting & Diagnostics

- **`[vite] http proxy error: AggregateError [ECONNREFUSED]`**:
  The backend process is not running or listening on port 8000. Start the backend with:
  `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
- **`[Errno 10048] only one usage of each socket address is normally permitted`**:
  Another process is already bound to port 8000. Find and stop it using:
  ```powershell
  Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
  Stop-Process -Id <PID> -Force
  ```
- **Weather / Geocoding timeout**:
  Ensure outgoing HTTPS access to `api.open-meteo.com` and `geocoding-api.open-meteo.com` is not blocked by local firewalls.

---

## 10. GitHub Publishing Workflow

When ready to publish to GitHub:

1. Initialize git and inspect status:
   ```powershell
   git init
   git branch -M main
   git status --short
   ```
2. Confirm `.env` and `.data` are ignored:
   ```powershell
   git status --ignored
   ```
3. Stage project files and commit:
   ```powershell
   git add .
   git commit -m "feat: initial commit of ANVEṢAṆAM AI"
   ```
4. Connect remote repository and push:
   ```powershell
   git remote add origin https://github.com/NeerajNagore/-ANVE-A-AM-AI-.git
   git push -u origin main
   ```

---

## 11. Production Deployment

### Option A: Containerized Deployment (Google Cloud Run / AWS ECS / Render)

1. **Build Docker Image**:
   ```bash
   docker build -t anveshanam-backend:latest ./nexus_backend
   ```
2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy anveshanam-api \
     --source ./nexus_backend \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars CORS_ORIGINS="https://your-frontend-domain.com"
   ```
3. Set secrets in Cloud Run: `GROQ_API_KEY`, `TAVILY_API_KEY`, `NEWSAPI_KEY`.

### Option B: Static Frontend Hosting (Vercel / Cloudflare Pages / Firebase)

1. Build production static bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder.
3. Configure environment variable on host:
   `VITE_API_BASE_URL=https://your-deployed-backend-url`
4. Add SPA rewrite rule (`/* -> /index.html`).

---

## 12. Security Guidelines

1. **No Client-Side Secrets**: Never add private API keys (`GROQ_API_KEY`, `TAVILY_API_KEY`, `NEWSAPI_KEY`) to frontend `.env` files or variables prefixed with `VITE_`.
2. **Key Store Isolation**: Server-side keys saved via `/integrations` are written to `.data/keys.json` with restricted permissions and are git-ignored.
3. **CORS Configuration**: Restrict `CORS_ORIGINS` in production to your actual frontend domain instead of wildcards.
