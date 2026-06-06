from typing import List, Optional, Literal, Union
from pydantic import BaseModel, Field


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    format: Optional[str] = None
    metadata: Optional[dict] = None


class FinalizeRequest(BaseModel):
    session_id: str
    answers: List[str] = Field(default_factory=list)


class SynthesizeSuccessResponse(BaseModel):
    status: Literal["SUCCESS"]
    content: str
    benchmark_score: int = Field(ge=0, le=100)
    directives: List[str]


class SynthesizeNeedsInfoResponse(BaseModel):
    status: Literal["NEEDS_INFO"]
    session_id: str
    gaps: List[str]


class FinalResultResponse(BaseModel):
    status: Literal["FINAL_RESULT"]
    content: str
    benchmark_score: int
    directives: List[str]


class FinalResultAfterGapFilledResponse(BaseModel):
    status: Literal["FINAL_RESULT_AFTER_GAP_FILLED"]
    content: str
    benchmark_score: int
    directives: List[str]
    editorial_brief: str
    gap_status: List[str]


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
