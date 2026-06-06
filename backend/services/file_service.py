import uuid
from pathlib import Path
from fastapi import UploadFile

from core.config import UPLOAD_DIR


def save_uploaded_file(file: UploadFile, contents: bytes) -> Path:
    suffix = Path(file.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    path = UPLOAD_DIR / unique_name
    path.write_bytes(contents)
    return path


def safe_decode_text(data: bytes) -> str:
    return data.decode("utf-8", errors="ignore")
