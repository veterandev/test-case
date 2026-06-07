# backend/services/vosk_service.py

import json
from vosk import Model, KaldiRecognizer

MODEL_PATH = "models/vosk-model-small-en-us-0.15"

model = Model(MODEL_PATH)


def create_recognizer():
    rec = KaldiRecognizer(model, 16000)
    rec.SetWords(False)
    return rec


def process_chunk(recognizer, chunk: bytes):

    if recognizer.AcceptWaveform(chunk):
        result = json.loads(recognizer.Result())
        return {"type": "final", "text": result.get("text", "")}

    else:
        partial = json.loads(recognizer.PartialResult())
        return {"type": "partial", "text": partial.get("partial", "")}
