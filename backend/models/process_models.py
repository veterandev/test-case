# models/process_models.py

from __future__ import annotations

from enum import Enum
from typing import Any, Optional, List, Dict
from uuid import uuid4
from datetime import datetime

from pydantic import BaseModel, Field


class ProcessStatus(str, Enum):
    STARTED = "STARTED"
    SYNTHESIZED = "SYNTHESIZED"
    NEEDS_INFO = "NEEDS_INFO"
    USER_ANSWERS_RECEIVED = "USER_ANSWERS_RECEIVED"
    GAP_ANALYZED = "GAP_ANALYZED"
    POLISHED = "POLISHED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ProcessStep(str, Enum):
    SYNTHESIZE = "synthesize"
    GAP_ANALYSIS = "gap_analysis"
    POLISH = "polish"


class LLMCallRecord(BaseModel):
    step: str
    prompt_name: str
    prompt_input: Dict[str, Any]
    raw_output: Optional[str] = None
    parsed_json: Optional[Dict[str, Any]] = None
    model: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    error: Optional[str] = None


class UserQuestion(BaseModel):
    id: str
    question: str
    field: Optional[str] = None
    type: Optional[str] = None
    options: Optional[List[str]] = None


class UserAnswer(BaseModel):
    question_id: str
    answer: Any
    answered_at: datetime = Field(default_factory=datetime.utcnow)


class ProcessRun(BaseModel):
    process_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str

    status: ProcessStatus = ProcessStatus.STARTED

    initial_user_input: Dict[str, Any]

    synthesize_output: Optional[Dict[str, Any]] = None

    needs_info_questions: Optional[List[UserQuestion]] = None
    user_answers: Optional[List[UserAnswer]] = None

    gap_analysis_output: Optional[Dict[str, Any]] = None

    polish_output: Optional[Dict[str, Any]] = None
    final_response_to_frontend: Optional[Dict[str, Any]] = None

    llm_calls: List[LLMCallRecord] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    error: Optional[str] = None

    def add_llm_call(self, record: LLMCallRecord):
        self.llm_calls.append(record)
        self.updated_at = datetime.utcnow()

    def set_status(self, status: ProcessStatus) -> None:
        self.status = status
        self.updated_at = datetime.utcnow()

    def set_synthesize_output(self, data: Dict[str, Any]) -> None:
        self.synthesize_output = data
        self.status = ProcessStatus.SYNTHESIZED
        self.updated_at = datetime.utcnow()

    def set_needs_info_questions(self, questions: List[UserQuestion]) -> None:
        self.needs_info_questions = questions
        self.status = ProcessStatus.NEEDS_INFO
        self.updated_at = datetime.utcnow()

    def set_user_answers(self, answers: List[UserAnswer]) -> None:
        self.user_answers = answers
        self.status = ProcessStatus.USER_ANSWERS_RECEIVED
        self.updated_at = datetime.utcnow()

    def set_gap_analysis_output(self, data: Dict[str, Any]) -> None:
        self.gap_analysis_output = data
        self.status = ProcessStatus.GAP_ANALYZED
        self.updated_at = datetime.utcnow()

    def set_polish_output(self, data: Dict[str, Any]) -> None:
        self.polish_output = data
        self.status = ProcessStatus.POLISHED
        self.updated_at = datetime.utcnow()

    def complete(self, final_response: Dict[str, Any]) -> None:
        self.final_response_to_frontend = final_response
        self.status = ProcessStatus.COMPLETED
        self.updated_at = datetime.utcnow()

    def fail(self, error: str) -> None:
        self.error = error
        self.status = ProcessStatus.FAILED
        self.updated_at = datetime.utcnow()
