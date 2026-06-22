# api/process_api.py

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from models.process_models import UserAnswer, UserQuestion
from services.process_manager import ProcessManager
from services.llm_logger import log_llm_call
from services.workflow_service import run_synthesize, run_gap_analysis


router = APIRouter()

process_manager = ProcessManager()


@router.post("/process/start")
def start_process(payload: Dict[str, Any]):

    user_id = payload["user_id"]
    user_input = payload["input"]

    run = process_manager.create_process(user_id, user_input)

    return {
        "process_id": run.process_id,
        "status": run.status,
    }


@router.post("/process/{process_id}/synthesize")
def synthesize(process_id: str, payload: Dict[str, Any]):

    run = process_manager.get(process_id)

    prompt_input = payload["prompt_input"]
    raw_output = payload.get("raw_output")
    parsed_json = payload.get("parsed_json")
    model = payload.get("model")

    log_llm_call(
        run,
        step="synthesize",
        prompt_name="synthesize_v1",
        prompt_input=prompt_input,
        raw_output=raw_output,
        parsed_json=parsed_json,
        model=model,
    )

    process_manager.set_synthesize_output(process_id, parsed_json)

    status = parsed_json.get("status")

    if status == "FINAL":

        return {
            "process_id": process_id,
            "status": "FINAL",
        }

    if status == "NEEDS_INFO":

        questions = [UserQuestion(**q) for q in parsed_json.get("questions", [])]

        process_manager.set_needs_info(process_id, questions)

        return {
            "process_id": process_id,
            "status": "NEEDS_INFO",
            "questions": questions,
        }

    raise HTTPException(status_code=400, detail="Invalid synthesize output")


@router.post("/process/{process_id}/answers")
def submit_answers(process_id: str, payload: Dict[str, Any]):

    run = process_manager.get(process_id)

    answers_payload = payload["answers"]

    answers = [UserAnswer(**a) for a in answers_payload]

    process_manager.set_user_answers(process_id, answers)

    result = run_gap_analysis(run)

    return {
        "process_id": process_id,
        "status": "USER_ANSWERS_RECEIVED",
        "data": result
    }


@router.post("/process/{process_id}/gap-analysis")
def gap_analysis(process_id: str, payload: Dict[str, Any]):

    run = process_manager.get(process_id)

    prompt_input = payload["prompt_input"]
    raw_output = payload.get("raw_output")
    parsed_json = payload.get("parsed_json")
    model = payload.get("model")

    log_llm_call(
        run,
        step="gap_analysis",
        prompt_name="gap_analysis_v1",
        prompt_input=prompt_input,
        raw_output=raw_output,
        parsed_json=parsed_json,
        model=model,
    )

    process_manager.set_gap_analysis(process_id, parsed_json)

    return {
        "process_id": process_id,
        "status": "GAP_ANALYZED",
    }


@router.post("/process/{process_id}/polish")
def polish(process_id: str, payload: Dict[str, Any]):

    run = process_manager.get(process_id)

    prompt_input = payload["prompt_input"]
    raw_output = payload.get("raw_output")
    parsed_json = payload.get("parsed_json")
    model = payload.get("model")

    log_llm_call(
        run,
        step="polish",
        prompt_name="polish_v1",
        prompt_input=prompt_input,
        raw_output=raw_output,
        parsed_json=parsed_json,
        model=model,
    )

    process_manager.set_polish(process_id, parsed_json)
    process_manager.complete(process_id, parsed_json)

    return {
        "process_id": process_id,
        "status": "COMPLETED",
        "result": parsed_json,
    }


@router.get("/process/{process_id}")
def get_process(process_id: str):

    run = process_manager.get(process_id)

    return run
