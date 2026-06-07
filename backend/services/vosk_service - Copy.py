import json
from vosk import Model, KaldiRecognizer

MODEL_PATH = "models/vosk-model-small-en-us-0.15"

model = Model(MODEL_PATH)


def create_recognizer():

    rec = KaldiRecognizer(model, 16000)
    rec.SetWords(True)

    return rec


def accept_audio(recognizer, pcm):

    if recognizer.AcceptWaveform(pcm):

        res = json.loads(recognizer.Result())

        return {
            "type": "final",
            "text": res.get("text", "")
        }

    else:

        res = json.loads(recognizer.PartialResult())

        return {
            "type": "partial",
            "text": res.get("partial", "")
        }
