from fastapi import APIRouter, HTTPException
from pathlib import Path
import requests
import time

from core.config import OPENAI_API_KEY, openai_client, AI_MODELS

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
audio_path = BASE_DIR / "test.oga"


@router.get("/api/ai_test")
async def ai_test():

    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY missing")

    start = time.time()

    chat_resp = openai_client.chat.completions.create(
        model=AI_MODELS[6].get("model","test"),
        messages=[{"role": "user", "content": "what do you do?"}],
    )

    chat_text = chat_resp.choices[0].message.content

    latency = time.time() - start
    usage = chat_resp.usage
    cost = (usage.total_tokens*(AI_MODELS[6].get("out","1")+AI_MODELS[6].get("in","1"))/1000000)
    print("LLM_LATENCY:", latency)
    print("TOKENS:", usage.total_tokens)
    print("COST: $", cost)
    print("model_name:", AI_MODELS[6].get("model","test"))

    transcript_text = None
    transcription_error = None

    print("Transcribing:", audio_path)
    print("Exists:", audio_path.exists())
    print("Size:", audio_path.stat().st_size if audio_path.exists() else "missing")

    try:

        with open(audio_path, "rb") as f:

            response = requests.post(
                "https://api.gapgpt1.app/v1/audio/transcriptions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                },
                files={
                    "file": ("test.oga", f, "audio/oga"),
                },
                data={
                    "model": "whisper-1",
                },
                timeout=120,
            )

        if response.status_code != 200:
            transcription_error = response.text
        else:
            data = response.json()
            transcript_text = data.get("text")

    except Exception as e:
        transcription_error = f"{type(e).__name__}: {e}"

    return {
        "status": "SUCCESS",
        "chat": chat_text,
        "transcript": transcript_text,
        "transcription_error": transcription_error,
    }
