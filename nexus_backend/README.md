# ANVEṢAṆAM AI — backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # add keys here, or later via the app's Integrations page
uvicorn app.main:app --reload --port 8000
```

Frontend `.env.local`: `VITE_API_BASE_URL=/api` (dev proxy) — then restart `npm run dev`.
Production: set `VITE_API_BASE_URL=https://your-api-host` and `CORS_ORIGINS=https://your-frontend-host`.

Endpoints: `POST /chat/stream`, `POST /research`, `GET /news`, `GET /weather`, `GET/PUT/DELETE /integrations[/{id}]`, `POST /integrations/{id}/test`, `GET /health`. Interactive docs at `/docs`.

Notes
- Keys saved from the UI go to `.data/keys.json` (chmod 600, git-ignored); env vars are the fallback. Keys are never returned by any endpoint.
- `/integrations` PUT/DELETE have **no auth** (the frontend sends none). Run locally, or put the API behind your own auth/VPN before exposing it publicly.
- News: with a search term, `/everything` is used (category ignored); otherwise `/top-headlines` for `NEWS_COUNTRY`.
- Chat without a Tavily key still works (no web search, no citations).
