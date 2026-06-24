import os
import json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_GPT4O_MODEL = os.getenv("OPENAI_GPT4O_MODEL", "").strip()

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

TEXT_EXTENSIONS = {".txt", ".docx", ".json", ".csv", ".jsonl"}
AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".oga", ".flac", ".aac"}


extra_origins = os.getenv("EXTRA_CORS_ORIGINS", "").strip()
extra_origins_list = [o.strip() for o in extra_origins.split(",") if o.strip()]

allowed_origins = [
    "http://45.129.38.84:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    *extra_origins_list,
]


openai_client = (
    OpenAI(base_url="https://api.gapgpt.app/v1", api_key=OPENAI_API_KEY)
    if OPENAI_API_KEY
    else None
)


load_dotenv()

models_raw = os.getenv("AI_MODELS")

if models_raw:
    try:
        AI_MODELS = json.loads(models_raw)
        
        for m in AI_MODELS:
            print(f"Model2: {m['model']} | In: ${m['in']}/M | Out: ${m['out']}/M")
            
    except json.JSONDecodeError as e:
        print("Error parsing AI_MODELS JSON:", e)
        AI_MODELS = []
else:
    print("AI_MODELS is not defined in env")
    AI_MODELS = []

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./case_depth.db")
SESSION_EXPIRE_HOURS = int(os.getenv("SESSION_EXPIRE_HOURS", 12))
