from typing import List, Literal, Optional, Union
import asyncio
import os
import random

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI


app = FastAPI(title="CaseDepth API", version="0.1.0")

# اجازه بدهیم از env هم origin اضافه شود (برای deploy/preview)
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

# -----------------------------
# Request Models
# -----------------------------
class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    format: Optional[str] = None


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

client = OpenAI(base_url="https://api.gapgpt.app/v1", api_key="sk-jEk2ZkPZbsSLRyNSVW7GnnELr7jmhu4mcCxVmhE9coGerf05")

# -----------------------------
# Routes
# -----------------------------
@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/ai")
async def ai():
    await asyncio.sleep(2)
    response = client.chat.completions.create(
    #    model="gpt-4o-mini",
        model="gemini-2.5-flash-lite",
        messages=[{"role": "user", "content": "what do you do?"}]
    )
    print(response.choices[0].message.content)
    return(response.choices[0].message.content)


@app.post("/api/synthesize", response_model=SynthesizeResponse)
async def synthesize(payload: SynthesizeRequest):
    await asyncio.sleep(2)

    # Mock logic (random)
    if random.choice([True, False]):
        print("SYNTHESIZE called -> SUCCESS")
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

    print("SYNTHESIZE called -> NEEDS_INFO")
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
    await asyncio.sleep(2)

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
