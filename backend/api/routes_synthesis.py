import asyncio
import random

from fastapi import APIRouter, HTTPException

from models.schemas import (
    SynthesizeRequest,
    FinalizeRequest,
    AnswerRequest,
    SynthesizeNeedsInfoResponse,
    AnswerResponse,
    FinalResultResponse,
    FinalResultAfterGapFilledResponse,
)

from services.ai_service import (
    create_gap_session,
    finalize_after_gap_session,
    answer_session,
    finalize_output_session,
    run_llm_synthesis,
)

from services.session_store import sessions

router = APIRouter()


@router.post("/api/synthesize")
async def synthesize(payload: SynthesizeRequest):

#    print("Payload:", payload)

    llm_result = run_llm_synthesis(
        payload.text,
        payload.metadata,
        payload.format,
    )

#    print("LLM_result:", llm_result)
    if llm_result:

        status = llm_result.get("Status")
#        print("LLM_result_status:", status)

        if status == "Ready_To_Draft":

            draft = llm_result.get("Condition_B_Output", {}).get("Draft", "")
            scores = llm_result.get("Scores", {})
            total_score = scores.get("Total", 40)*2

            print("Draft:", draft)
            print("scores:", scores)
            print("TS:", total_score)

            final_result = finalize_output_session(
                draft,
                payload.metadata,
                payload.format,
            )
            if final_result is None:
                raise HTTPException(status_code=404, detail="Session not found")
            else:
                print("Final Resault:", final_result)

            return FinalResultResponse(
                status="FINAL_RESULT",
                session_id="direct-finalize",
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

    result = finalize_after_gap_session(payload.session_id, payload.answers)

    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")

    llm_output = result
    draft = ""
    editorial = ""
    resault_satatus = ""
    analysis_summary1 = ""
    warnings1 = ""
    title_or_hook = ""
    outline1 = ""

    if llm_output:
        draft = llm_output.get("Content", {}).get("Rich_Draft", "")
        title_or_hook = llm_output.get("Content", {}).get("Title_or_Hook", "")
        outline_list = llm_output.get("Content", {}).get("Outline", [])
        editorial = llm_output.get("Evaluation", {}).get("Ghostwriter_Notes", "")
        resault_satatus =  llm_output.get("Evaluation", {}).get("Status", "")
        analysis_summary1 =  llm_output.get("Evaluation", {}).get("Analysis_Summary", "")
        warnings_list =  llm_output.get("Evaluation", {}).get("Warnings", [])

        outline1 = "\n".join(list(item.values())[0] for item in outline_list)
        warnings1 = ", ".join(warnings_list)
        
        if resault_satatus == "Satisfactory":
            r_score = random.randint(80, 95)

        elif resault_satatus == "Partial_Evasive":
            r_score = random.randint(50, 75)

        elif resault_satatus == "Sanity_Warning":
            r_score = random.randint(15, 45)
        else:
            r_score = random.randint(40, 60)

        session = sessions.get(payload.session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found")

        final_result = finalize_output_session(
            draft,
            session.get("metadata"),
            session.get("format"),
        )
        if final_result is None:
            raise HTTPException(status_code=404, detail="Session not found")
        else:
            print("Final Polished Resault:", final_result)

    return FinalResultAfterGapFilledResponse(
        status="FINAL_RESULT_AFTER_GAP_FILLED",
        session_id=payload.session_id,
#       gap filling quality evaluation
        gap_status=resault_satatus,
        analysis_summary=analysis_summary1,
        warnings=warnings1,
        writer_note=editorial,
#       output
        title=title_or_hook,
        content=draft,
        outline=outline1,
#       output evaluation
        benchmark_score=r_score,
        directives=[
            "Verify anonymization level against NDA setting.",
            "Run final editorial polish.",
        ]
    )


@router.post("/api/answer")
async def answer(payload: AnswerRequest):

    result = answer_session(payload.session_id, payload.rbp)

    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")

    llm_output = result

    if llm_output:
        mock_answers = [item["Mock_Answer"] for item in llm_output["Mock_Questions_and_Answers"]]

    print("Answers",mock_answers)
    return AnswerResponse(
        status="ANSWERS",
        session_id=payload.session_id,
        answers=mock_answers
    )

