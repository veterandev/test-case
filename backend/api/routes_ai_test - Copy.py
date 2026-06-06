from fastapi import APIRouter, HTTPException
from openai import RateLimitError
from pathlib import Path


from core.config import openai_client

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
audio_path = BASE_DIR / "test.oga"

@router.get("/api/ai_test")
async def ai_test():

    if openai_client is None:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY missing")

    chat_resp = openai_client.chat.completions.create(
        model="gemini-2.5-flash-lite",
        messages=[{"role": "user", "content": "what do you do?"}],
    )

    chat_text = chat_resp.choices[0].message.content

    transcript_text = None
    transcription_error = None

    print("Transcribing:", audio_path)
    print("Exists:", Path(audio_path).exists())

    try:

        with open(audio_path, "rb") as f:
            tr_resp = openai_client.audio.transcriptions.create(
                model="gapgpt/whisper-1",
                file=f,
            )

        transcript_text = tr_resp.text

    except FileNotFoundError:
        transcription_error = "test.oga not found"

    except RateLimitError as e:
        transcription_error = f"Rate limited (429): {e}"

    except Exception as e:
        transcription_error = f"{type(e).__name__}: {e}"

    return {
        "status": "SUCCESS",
        "chat": chat_text,
        "transcript": transcript_text,
        "transcription_error": transcription_error,
    }
