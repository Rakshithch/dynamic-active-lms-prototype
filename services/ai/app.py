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

class QuestionGenerationPayload(BaseModel):
    topic: str
    difficulty: int = 1
    skill_tag: str
    num_questions: int = 3
    grade_level: str = "6-8"

class GeneratedQuestion(BaseModel):
    type: str
    prompt: str
    options: Optional[List[str]] = None
    answer_key: str
    rubric_keywords: Optional[List[str]] = None
    explanation: str

class QuestionGenerationResult(BaseModel):
    questions: List[GeneratedQuestion]
    topic: str
    total_generated: int

@app.post("/generate_questions", response_model=QuestionGenerationResult)
async def generate_questions(payload: QuestionGenerationPayload):
    """Generate questions using AI for a given topic and difficulty level"""
    questions = []
    
    # Generate MCQ questions
    for i in range(payload.num_questions - 1):  # Generate n-1 MCQ questions
        if payload.skill_tag == "fractions":
            questions.append(GeneratedQuestion(
                type="mcq",
                prompt=f"What is the result of 1/{i+2} + 1/{i+3}?",
                options=[f"{2*i+5}/{(i+2)*(i+3)}", f"{i+2}/{i+3}", f"2/{i+5}", f"1/{i+1}"],
                answer_key=f"{2*i+5}/{(i+2)*(i+3)}",
                explanation=f"To add fractions, find common denominator: {(i+2)*(i+3)}"
            ))
        elif payload.skill_tag == "algebra":
            questions.append(GeneratedQuestion(
                type="mcq",
                prompt=f"Solve for x: {i+2}x + {i+3} = {(i+2)*5 + (i+3)}",
                options=["5", f"{i+3}", f"{i+2}", "10"],
                answer_key="5",
                explanation=f"Subtract {i+3} from both sides, then divide by {i+2}"
            ))
        else:
            questions.append(GeneratedQuestion(
                type="mcq",
                prompt=f"Which of the following best describes {payload.topic}?",
                options=["Concept A", "Concept B", "Concept C", "Concept D"],
                answer_key="Concept A",
                explanation=f"This tests understanding of {payload.topic} fundamentals"
            ))
    
    # Generate one short answer question
    if payload.skill_tag == "fractions":
        questions.append(GeneratedQuestion(
            type="short",
            prompt=f"Explain how to add two fractions with different denominators. Use {payload.topic} as context.",
            answer_key="Find common denominator, convert to equivalent fractions, add numerators",
            rubric_keywords=["common denominator", "equivalent fractions", "add numerators", "simplify"],
            explanation="This assesses procedural understanding of fraction addition"
        ))
    elif payload.skill_tag == "algebra":
        questions.append(GeneratedQuestion(
            type="short",
            prompt=f"Describe the steps to solve a linear equation. Relate this to {payload.topic}.",
            answer_key="Isolate variable by inverse operations, maintain equation balance",
            rubric_keywords=["isolate", "variable", "inverse operations", "balance", "both sides"],
            explanation="This tests understanding of algebraic problem-solving process"
        ))
    else:
        questions.append(GeneratedQuestion(
            type="short",
            prompt=f"Provide a detailed explanation of {payload.topic} and its applications.",
            answer_key=f"Key concepts and applications of {payload.topic}",
            rubric_keywords=[payload.topic.lower(), "explanation", "applications", "examples"],
            explanation=f"This assesses comprehensive understanding of {payload.topic}"
        ))
    
    return QuestionGenerationResult(
        questions=questions,
        topic=payload.topic,
        total_generated=len(questions)
    )
