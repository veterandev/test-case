import asyncio

from fastapi import APIRouter, HTTPException

from models.schemas import (
    SynthesizeRequest,
    FinalizeRequest,
    SynthesizeNeedsInfoResponse,
    FinalResultResponse,
    FinalResultAfterGapFilledResponse,
)

from services.ai_service import create_gap_session, finalize_session

router = APIRouter()


@router.post("/api/synthesize")
async def synthesize(payload: SynthesizeRequest):

    await asyncio.sleep(0.5)

    if len(payload.text) > 400:

        return FinalResultResponse(
            status="FINAL_RESULT",
            content=(
                f"Input Summary: {payload.text[:140].strip()}...\n\n"
                "Narrative Draft:\n"
                "• Executive Context: ...\n"
                "• Strategic Stakes: ...\n"
                "• Decision Logic: ...\n"
                "• Proof & Metrics: ...\n"
            ),
            benchmark_score=90,
            directives=[
                "Refine the executive framing.",
                "Strengthen differentiation.",
            ],
        )

    session_id, gaps = create_gap_session(
        payload.text,
        payload.metadata,
        payload.format,
    )

    return SynthesizeNeedsInfoResponse(
        status="NEEDS_INFO",
        session_id=session_id,
        gaps=gaps,
    )


@router.post("/api/finalize")
async def finalize(payload: FinalizeRequest):

    await asyncio.sleep(0.5)

    result = finalize_session(payload.session_id, payload.answers)

    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")

    statuses, joined_answers = result

    return FinalResultAfterGapFilledResponse(
        status="FINAL_RESULT_AFTER_GAP_FILLED",
        content=(
            "Synthesized Narrative (Final)\n\n"
            "Gap Resolution Summary:\n"
            f"{joined_answers}\n\n"
            "Final Narrative Draft:\n"
            "• Context\n"
            "• Strategic Stakes\n"
            "• Intervention\n"
            "• Outcome\n"
        ),
        benchmark_score=94,
        directives=[
            "Verify anonymization level against NDA setting.",
            "Run final editorial polish.",
        ],
        editorial_brief=(
            "Ensure the narrative clearly emphasizes measurable impact "
            "and strategic differentiation."
        ),
        gap_status=statuses,
    )
