from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict

app = FastAPI(title="AI Service", version="0.1.0")

class ShortAnswerPayload(BaseModel):
    prompt: str
    answer: str
    rubric_keywords: List[str] = []

class GradeResult(BaseModel):
    score: float
    feedback: str

class RecommendPayload(BaseModel):
    student_id: int
    mastery: Optional[Dict[str, float]] = None

class RecommendResult(BaseModel):
    next_lesson_id: int
    reason: str

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/grade_short_answer", response_model=GradeResult)
async def grade_short_answer(payload: ShortAnswerPayload):
    answer_lower = payload.answer.lower()
    hits = sum(1 for kw in payload.rubric_keywords if kw.lower() in answer_lower)
    score = min(1.0, hits / max(1, len(payload.rubric_keywords))) if payload.rubric_keywords else 0.5
    feedback = "Good start. Mention: " + ", ".join(payload.rubric_keywords) if payload.rubric_keywords else "Good start."
    return GradeResult(score=round(score,2), feedback=feedback)

@app.post("/recommend_next", response_model=RecommendResult)
async def recommend_next(payload: RecommendPayload):
    mastery = payload.mastery or {"fractions": 62}
    # Simple rule: if fractions < 70%, recommend remediation lesson (id=2). Else enrichment (id=3)
    if mastery.get("fractions", 0) < 70:
        return RecommendResult(next_lesson_id=2, reason="Fractions mastery below 70% → recommend remediation: Fraction Addition")
    return RecommendResult(next_lesson_id=3, reason="Mastery high → recommend enrichment: Fraction Comparison")
