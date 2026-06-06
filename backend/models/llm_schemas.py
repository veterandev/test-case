from pydantic import BaseModel
from typing import List, Optional


class ScoreModel(BaseModel):
    Data: Optional[float] = 0
    Risk: Optional[float] = 0
    Execution: Optional[float] = 0
    Emotion: Optional[float] = 0
    Resources: Optional[float] = 0
    Total: Optional[float] = 0


class QuestionModel(BaseModel):
    Q: str
    Reason: Optional[str] = None


class ConditionAOutput(BaseModel):
    Questions: Optional[List[QuestionModel]] = []


class ConditionBOutput(BaseModel):
    Outline: Optional[List[str]] = []
    Draft: Optional[str] = ""


class SynthesisDecision(BaseModel):
    Status: str
    Scores: Optional[ScoreModel] = None
    Condition_A_Output: Optional[ConditionAOutput] = None
    Condition_B_Output: Optional[ConditionBOutput] = None
