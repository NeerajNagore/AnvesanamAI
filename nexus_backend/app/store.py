"""Server-side API key store. Keys never leave the backend and are never returned by any endpoint.

Priority: key saved from the UI (DATA_DIR/keys.json, chmod 600) > environment variable.
"""
import json
import os
import threading

from .config import DATA_DIR

# ENV_NAMES = {"openai": "OPENAI_API_KEY", "tavily": "TAVILY_API_KEY", "newsapi": "NEWSAPI_KEY"}
ENV_NAMES = {
    "openai": "OPENAI_API_KEY",
    "grok": "GROQ_API_KEY",
    "tavily": "TAVILY_API_KEY",
    "newsapi": "NEWSAPI_KEY",
}
_lock = threading.Lock()
_FILE = DATA_DIR / "keys.json"


def _read() -> dict[str, str]:
    try:
        return json.loads(_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _write(data: dict[str, str]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = _FILE.with_suffix(".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(data, f)
    os.replace(tmp, _FILE)


def get_key(integration: str) -> str | None:
    with _lock:
        stored = _read().get(integration)
    return stored or os.getenv(ENV_NAMES.get(integration, ""), "").strip() or None


def source_of(integration: str) -> str | None:
    with _lock:
        if _read().get(integration):
            return "ui"
    return "env" if os.getenv(ENV_NAMES.get(integration, ""), "").strip() else None


def set_key(integration: str, key: str) -> None:
    with _lock:
        data = _read()
        data[integration] = key
        _write(data)


def delete_key(integration: str) -> None:
    with _lock:
        data = _read()
        if data.pop(integration, None) is not None:
            _write(data)
