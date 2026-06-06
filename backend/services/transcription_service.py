from openai import RateLimitError
from core.config import openai_client
from pathlib import Path


def transcribe_audio(file_path):

    if openai_client is None:
        return None, "OPENAI_API_KEY is missing."

    print("Transcribing:", file_path)
    print("Exists:", Path(file_path).exists())

    try:

        with open(file_path, "rb") as f:
            response = openai_client.audio.transcriptions.create(
                model="gapgpt/whisper-1",
                file=f,
            )

        return response.text, None

    except RateLimitError as e:
        return None, f"Rate limited (429): {e}"

    except Exception as e:
        return None, f"{type(e).__name__}: {e}"
