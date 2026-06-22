from typing import Dict, List, Optional, Union, Literal, Any
from pydantic import BaseModel, Field

# --- Requests ---
class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    format: Optional[str] = None
    metadata: Optional[dict] = None

class AnswerRequest(BaseModel):
    session_id: str
    rbp: str

class FinalizeRequest(BaseModel):
    session_id: str
    answers: List[str] = Field(default_factory=list)

# --- Responses ---
class SynthesizeSuccessResponse(BaseModel): #می تواند حذف شود
#    status: Literal["SUCCESS"]
    status: Literal["SUCCESS1"] = "SUCCESS1" # اصلاح شده طبق درخواست شما
    session_id: str
    content: str
    benchmark_score: int = Field(ge=0, le=100)
    directives: List[str]

class SynthesizeNeedsInfoResponse(BaseModel):
    status: Literal["NEEDS_INFO"] = "NEEDS_INFO"
    session_id: str
    gaps: List[str]

class FinalResultResponse(BaseModel):
    status: Literal["FINAL_RESULT"] = "FINAL_RESULT"
    session_id: str
    content: str
    benchmark_score: Optional[int] = None
    directives: List[str] = []

class AnswerResponse(BaseModel):
    status: Literal["ANSWERS"] = "ANSWERS"
    session_id: str
    answers: List[str]

class FinalResultAfterGapFilledResponse(BaseModel):
    status: Literal["FINAL_RESULT_AFTER_GAP_FILLED"] = "FINAL_RESULT_AFTER_GAP_FILLED"
    session_id: str
    title: Optional[str] = None
#    title_or_hook: str # اصلاح شده برای هماهنگی با فرانت
    outline: Optional[str] = None
    content: str
    gap_status: str
    analysis_summary: str
    warnings: Optional[str] = None
    writer_note: Optional[str] = None
    benchmark_score: Optional[int] = None
    directives: List[str] = []


class UploadResponse(BaseModel):
    status: Literal["SUCCESS"]
    file_name: str
    file_type: str
    file_path: str
    text_content: Optional[str] = None
    transcription: Optional[str] = None
    transcription_error: Optional[str] = None


SynthesizeResponse = Union[
    SynthesizeSuccessResponse,
    SynthesizeNeedsInfoResponse,
    FinalResultResponse,
]
