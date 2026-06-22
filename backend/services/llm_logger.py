# services/llm_logger.py

from models.process_models import LLMCallRecord, ProcessRun


def log_llm_call(
    run: ProcessRun,
    step: str,
    prompt_name: str,
    prompt_input: dict,
    raw_output: str,
    parsed_json: dict,
    model: str,
    error: str | None = None,
):

    record = LLMCallRecord(
        step=step,
        prompt_name=prompt_name,
        prompt_input=prompt_input,
        raw_output=raw_output,
        parsed_json=parsed_json,
        model=model,
        error=error,
    )

    run.add_llm_call(record)
