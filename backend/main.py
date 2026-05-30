# main.py
from typing import List, Literal, Optional, Union
import asyncio
import os
import random
import uuid
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load .env (same folder as this file) - Windows friendly
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

# OpenAI (created lazily to avoid import-time crash)
from openai import OpenAI

app = FastAPI(title="CaseDepth API", version="0.1.0")

# Allow extra CORS origins via env (comma-separated)
extra_origins = os.getenv("EXTRA_CORS_ORIGINS", "").strip()
extra_origins_list = [o.strip() for o in extra_origins.split(",") if o.strip()]
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    *extra_origins_list,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

TEXT_EXTENSIONS = {
    ".txt",
    ".json",
    ".csv",
    ".jsonl",
}


# -----------------------------
# Request Models
# -----------------------------
class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    format: Optional[str] = None
    metadata: Optional[dict] = None  # keep compatible with your frontend changes


class FinalizeRequest(BaseModel):
    answers: List[str] = Field(default_factory=list)


# -----------------------------
# Response Models
# -----------------------------
class SynthesizeSuccessResponse(BaseModel):
    status: Literal["SUCCESS"]
    content: str
    benchmark_score: int = Field(ge=0, le=100)
    directives: List[str] = Field(default_factory=list)


class SynthesizeNeedsInfoResponse(BaseModel):
    status: Literal["NEEDS_INFO"]
    gaps: List[str] = Field(default_factory=list)


SynthesizeResponse = Union[SynthesizeSuccessResponse, SynthesizeNeedsInfoResponse]


class FinalizeSuccessResponse(BaseModel):
    status: Literal["SUCCESS"]
    content: str
    benchmark_score: int = Field(ge=0, le=100)
    directives: List[str] = Field(default_factory=list)


class UploadResponse(BaseModel):
    status: Literal["SUCCESS"]
    file_name: str
    file_type: str
    file_path: str
    text_content: Optional[str] = None


def get_openai_client() -> Optional[OpenAI]:
    """
    Creates the OpenAI client only when needed.
    Prevents uvicorn import-time crash if OPENAI_API_KEY is missing.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    return OpenAI(
        base_url="https://api.gapgpt.app/v1",
        api_key=api_key,
    )


# -----------------------------
# Routes
# -----------------------------
@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/ai")
async def ai():
    await asyncio.sleep(0.2)

    client = get_openai_client()
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is missing. Put it in backend/.env (next to main.py) or set env var.",
        )

    response = client.chat.completions.create(
        # model="gpt-4o-mini",
        model="gemini-2.5-flash-lite",
        messages=[{"role": "user", "content": "what do you do?"}],
    )
    return {"status": "SUCCESS", "content": response.choices[0].message.content}


@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    suffix = Path(file.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / unique_name

    contents = await file.read()
    file_path.write_bytes(contents)

    text_content = None
    if suffix in TEXT_EXTENSIONS:
        text_content = contents.decode("utf-8", errors="ignore")

    return UploadResponse(
        status="SUCCESS",
        file_name=file.filename,
        file_type=file.content_type or "application/octet-stream",
        file_path=str(file_path),
        text_content=text_content,
    )


@app.post("/api/synthesize", response_model=SynthesizeResponse)
async def synthesize(payload: SynthesizeRequest):
    await asyncio.sleep(0.5)

    # Mock logic (random)
    if random.choice([True, False]):
        return SynthesizeSuccessResponse(
            status="SUCCESS",
            content=(
                "The CaseDepth Blueprint\n\n"
                f"Input Summary: {payload.text[:140].strip()}...\n\n"
                "Narrative Draft:\n"
                "• Executive Context: ...\n"
                "• Strategic Stakes: ...\n"
                "• Decision Logic: ...\n"
                "• Proof & Metrics: ...\n"
            ),
            benchmark_score=88,
            directives=[
                "Tighten the executive framing in the opening lines.",
                "Add at least 1 concrete metric to support the outcome.",
                "Align the ending CTA to the selected Output Format.",
            ],
        )

    return SynthesizeNeedsInfoResponse(
        status="NEEDS_INFO",
        gaps=[
            "Clarify the primary objective behind the initiative described.",
            "What were the key performance indicators (KPIs) for this initiative?",
            "Who are the main stakeholders to consider for this narrative?",
        ],
    )


@app.post("/api/finalize", response_model=FinalizeSuccessResponse)
async def finalize(payload: FinalizeRequest):
    await asyncio.sleep(0.5)
    joined_answers = " | ".join([a.strip() for a in payload.answers if a.strip()])

    return FinalizeSuccessResponse(
        status="SUCCESS",
        content=(
            "Synthesized Narrative (Final)\n\n"
            "Gap Resolution Summary:\n"
            f"{joined_answers if joined_answers else 'No additional answers provided.'}\n\n"
            "Final Narrative Draft:\n"
            "• Context: ...\n"
            "• Tension / Stakes: ...\n"
            "• Intervention: ...\n"
            "• Outcome: ...\n"
        ),
        benchmark_score=94,
        directives=[
            "Verify anonymization level against NDA setting before publishing.",
            "Run a final editorial pass for concision and clarity.",
        ],
    )
