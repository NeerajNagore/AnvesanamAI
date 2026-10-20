import os
from pathlib import Path

from dotenv import load_dotenv

# Resolve .env relative to this file so it's found regardless of CWD
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATA_DIR = Path(os.getenv("DATA_DIR", ".data"))
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
NEWS_COUNTRY = os.getenv("NEWS_COUNTRY", "us")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",") if o.strip()]

LANGUAGES = {"en": "English", "hi": "Hindi", "es": "Spanish", "fr": "French", "de": "German", "ja": "Japanese"}
