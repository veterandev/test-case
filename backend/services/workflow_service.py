# services/workflow_service.py

from models.process_models import ProcessStatus, UserQuestion
from services.process_manager import ProcessManager
from services.llm_service import call_llm
from services.llm_logger import log_llm_call
from prompts.prompts import render_prompt, SYNTHESIS_PROMPT, INTEGRATING_PROMPT, ANSWERING_PROMPT, FINALIZE_PROMPT


def run_synthesize(run):

#    prompt = synthesize_prompt(run.initial_user_input)
    prompt = SYNTHESIS_PROMPT

    raw, parsed = call_llm(prompt)

    log_llm_call(
        run,
        step="synthesize",
        prompt_name="synthesize_v1",
        prompt_input=run.initial_user_input,
        raw_output=raw,
        parsed_json=parsed,
        model="gpt-4.1"
    )

    run.synthesize_output = parsed
    run.status = ProcessStatus.SYNTHESIZED

    if parsed["status"] == "FINAL":

        return run_polish(run, parsed)

    if parsed["status"] == "NEEDS_INFO":

        questions = [UserQuestion(**q) for q in parsed["questions"]]

        run.needs_info_questions = questions
        run.status = ProcessStatus.NEEDS_INFO

        return {
            "status": "NEEDS_INFO",
            "questions": questions
        }


def run_gap_analysis(run):

#    prompt = gap_analysis_prompt(
#        run.initial_user_input,
#        run.synthesize_output,
#        [a.dict() for a in run.user_answers]
#    )

    prompt = INTEGRATING_PROMPT


    raw, parsed = call_llm(prompt)

    log_llm_call(
        run,
        step="gap_analysis",
        prompt_name="gap_analysis_v1",
        prompt_input={},
        raw_output=raw,
        parsed_json=parsed,
        model="gpt-4.1"
    )

    run.gap_analysis_output = parsed
    run.status = ProcessStatus.GAP_ANALYZED

    return run_polish(run, parsed)


def run_polish(run, data):

#    prompt = polish_prompt(data)
    prompt = FINALIZE_PROMPT

    raw, parsed = call_llm(prompt)

    log_llm_call(
        run,
        step="polish",
        prompt_name="polish_v1",
        prompt_input=data,
        raw_output=raw,
        parsed_json=parsed,
        model="gpt-4.1"
    )

    run.polish_output = parsed
    run.final_response_to_frontend = parsed
    run.status = ProcessStatus.COMPLETED

    return {
        "status": "COMPLETED",
        "result": parsed
    }
