from fastapi import APIRouter, UploadFile, File, HTTPException

from models.schemas import UploadResponse
from services.file_service import save_uploaded_file, safe_decode_text
from services.transcription_service import transcribe_audio
from core.config import TEXT_EXTENSIONS, AUDIO_EXTENSIONS

router = APIRouter()


@router.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    contents = await file.read()
    file_path = save_uploaded_file(file, contents)

    suffix = file_path.suffix.lower()

    text_content = None
    transcription = None
    transcription_error = None

    if suffix in TEXT_EXTENSIONS:
        text_content = safe_decode_text(contents)

    elif suffix in AUDIO_EXTENSIONS:

        transcription, transcription_error = transcribe_audio(file_path)

        text_content = transcription

    return UploadResponse(
        status="SUCCESS",
        file_name=file.filename,
        file_type=file.content_type or "application/octet-stream",
        file_path=str(file_path),
        text_content=text_content,
        transcription=transcription,
        transcription_error=transcription_error,
    )
