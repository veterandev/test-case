import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

TEXT_EXTENSIONS = {".txt", ".docx", ".json", ".csv", ".jsonl"}
AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".oga", ".flac", ".aac"}


extra_origins = os.getenv("EXTRA_CORS_ORIGINS", "").strip()
extra_origins_list = [o.strip() for o in extra_origins.split(",") if o.strip()]

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    *extra_origins_list,
]


openai_client = (
    OpenAI(base_url="https://api.gapgpt.app/v1", api_key=OPENAI_API_KEY)
    if OPENAI_API_KEY
    else None
)
