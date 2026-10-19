import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import CORS_ORIGINS
from .errors import ServiceError
from .routers import chat, integrations, news, research, weather

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="ANVEṢAṆAM AI API", docs_url="/docs")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(ServiceError)
async def service_error(_: Request, e: ServiceError):
    return JSONResponse({"detail": e.message}, status_code=e.status)


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, e: RequestValidationError):
    first = e.errors()[0] if e.errors() else {}
    loc = ".".join(str(x) for x in first.get("loc", []) if x != "body")
    return JSONResponse({"detail": f"Invalid request{f' ({loc})' if loc else ''}: {first.get('msg', '')}"}, status_code=422)


@app.get("/health")
async def health():
    return {"ok": True}


# Mounted at "/" (VITE_API_BASE_URL=https://api.example.com) and at "/api" (Vite dev proxy: /api -> :8000, no rewrite).
for r in (chat.router, research.router, news.router, weather.router, integrations.router):
    app.include_router(r)
    app.include_router(r, prefix="/api", include_in_schema=False)
