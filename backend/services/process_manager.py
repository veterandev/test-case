# services/process_manager.py

from typing import Dict, List

from models.process_models import (
    ProcessRun,
    ProcessStatus,
    UserQuestion,
    UserAnswer,
)


class ProcessManager:

    def __init__(self) -> None:
        self._runs: Dict[str, ProcessRun] = {}

    def create_process(self, user_id: str, initial_user_input: dict) -> ProcessRun:
        run = ProcessRun(
            user_id=user_id,
            initial_user_input=initial_user_input,
        )
        self._runs[run.process_id] = run
        return run

    def get(self, process_id: str) -> ProcessRun:

        if process_id not in self.runs:
            raise ValueError("Process not found")

        return self._runs[process_id]

    def save(self, run: ProcessRun):
        self._runs[run.process_id] = run

    def set_synthesize_output(self, process_id: str, data: dict) -> ProcessRun:
        run = self.get(process_id)
        run.set_synthesize_output(data)
        return run

    def set_needs_info(self, process_id: str, questions: List[UserQuestion]) -> ProcessRun:
        run = self.get(process_id)
        run.set_needs_info_questions(questions)
        return run

    def set_user_answers(self, process_id: str, answers: List[UserAnswer]) -> ProcessRun:
        run = self.get(process_id)
        run.set_user_answers(answers)
        return run

    def set_gap_analysis(self, process_id: str, data: dict) -> ProcessRun:
        run = self.get(process_id)
        run.set_gap_analysis_output(data)
        return run

    def set_polish(self, process_id: str, data: dict) -> ProcessRun:
        run = self.get(process_id)
        run.set_polish_output(data)
        return run

    def complete(self, process_id: str, final_response: dict) -> ProcessRun:
        run = self.get(process_id)
        run.complete(final_response)
        return run

    def fail(self, process_id: str, error: str) -> ProcessRun:
        run = self.get(process_id)
        run.fail(error)
        return run
