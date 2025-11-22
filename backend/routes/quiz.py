from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request

from helpers.helpers import fetch_transcript
from helpers.quiz.create_quiz import generate_quiz_from_transcript


router = APIRouter()


@router.get("/quiz")
def get_quiz(
    request: Request,
    video_id: str = Query(..., description="YouTube video ID (e.g., 'dQw4w9WgXcQ')"),
    language_code: Optional[str] = Query(
        None,
        description="Language code (e.g., 'en', 'es'). Defaults to YouTube fallback if not provided.",
    ),
    difficulty_level: str = Query(
        "medium",
        description="Difficulty level for the quiz prompt (easy, medium, hard).",
    ),
    question_count: int = Query(
        5, ge=1, le=20, description="Number of quiz questions to generate."
    ),
    temperature: float = Query(
        0.3,
        ge=0.0,
        le=1.0,
        description="Sampling temperature for Together completions.",
    ),
):
    """
    Generate a quiz for a given YouTube video transcript using Together's chat completions.
    """
    
    fetched_transcript = fetch_transcript(video_id, language_code)
    transcript_payload = fetched_transcript.to_raw_data()

    quiz = generate_quiz_from_transcript(
        transcript_payload,
        question_count=question_count,
        temperature=temperature,
        difficulty_level=difficulty_level,
        client=client,
    )

    return {"quiz": quiz}
