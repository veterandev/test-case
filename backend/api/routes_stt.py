from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.vosk_service import create_recognizer, accept_audio

router = APIRouter()

@router.websocket("/ws/stt")
async def stt_socket(ws: WebSocket):

    await ws.accept()

    recognizer = create_recognizer()

    try:

        while True:

            audio_bytes = await ws.receive_bytes()

            result = accept_audio(recognizer, audio_bytes)

            if result["text"]:

                await ws.send_json(result)

    except WebSocketDisconnect:

        print("STT disconnected")
