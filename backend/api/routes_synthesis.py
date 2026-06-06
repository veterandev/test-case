import asyncio

from fastapi import APIRouter, HTTPException

from models.schemas import (
    SynthesizeRequest,
    FinalizeRequest,
    SynthesizeNeedsInfoResponse,
    FinalResultResponse,
    FinalResultAfterGapFilledResponse,
)

from services.ai_service import (
    create_gap_session,
    finalize_session,
    run_llm_synthesis,
)

router = APIRouter()


@router.post("/api/synthesize")
async def synthesize(payload: SynthesizeRequest):

#    print("Payload:", payload)

    llm_result = run_llm_synthesis(
        payload.text,
        payload.metadata,
        payload.format,
    )

    print("LLM_result:", llm_result)
    if llm_result:

        status = llm_result.get("Status")
#        print("LLM_result_status:", status)

        if status == "Ready_To_Draft":

            draft = llm_result.get("Condition_B_Output", {}).get("Draft", "")
            scores = llm_result.get("Scores", {})
            total_score = scores.get("Total", 80)

            return FinalResultResponse(
                status="FINAL_RESULT",
                content=draft,
                benchmark_score=total_score,
                directives=[
                    "Refine the executive framing.",
                    "Strengthen differentiation.",
                ],
            )

        if status == "Needs_Info":

            questions = llm_result.get("Condition_A_Output", {}).get("Questions", [])

            gaps = [q.get("Q") for q in questions if q.get("Q")]
#            print("Gaps:", gaps)

            session_id, gaps = create_gap_session(
                payload.text,
                payload.metadata,
                payload.format,
                gaps,
            )

            return SynthesizeNeedsInfoResponse(
                status="NEEDS_INFO",
                session_id=session_id,
                gaps=gaps,
            )

    # fallback به رفتار فعلی (بدون تغییر)

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

    result = finalize_session(payload.session_id, payload.answers)

    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")

    statuses, llm_output = result
    draft = ""
    editorial = ""

    if llm_output:
        draft = llm_output.get("Content", {}).get("Rich_Draft", "")
        editorial = llm_output.get("Evaluation", {}).get("Ghostwriter_Notes", "")
        
    return FinalResultAfterGapFilledResponse(
        status="FINAL_RESULT_AFTER_GAP_FILLED",
        content=draft,
        benchmark_score=94,
        directives=[
            "Verify anonymization level against NDA setting.",
            "Run final editorial polish.",
        ],
        editorial_brief=editorial,
        gap_status=statuses,
    )
