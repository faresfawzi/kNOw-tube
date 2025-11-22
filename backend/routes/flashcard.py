from typing import Optional, Any

from fastapi import APIRouter, Request
from pydantic import BaseModel

from helpers.flashcards.create_flashcard import generate_multitype_flashcards, generate_qa_flashcards

router = APIRouter()

class QAFlashcardRequest(BaseModel):
    quiz_questions_with_wrong_answers: Any
    video_id: str
    language_code: Optional[str] = None

class MultitypeFlashcardRequest(BaseModel):
    video_id: str
    time_stamp: float = 0.0
    context_seconds: int = 30
    language_code: Optional[str] = None


@router.post("/generate_qa_flashcards")
def generate_qa_flashcards_api(
    request: Request,
    body: QAFlashcardRequest
):
    """
    Generate a flashcard for a given quiz questions using Together's chat completions.
    """
    
    client = request.app.state.together_client

    flashcards = generate_qa_flashcards(
        body.quiz_questions_with_wrong_answers,
        body.video_id,
        language_code=body.language_code,
        client=client
    )

    return {"flashcards": flashcards}


@router.post("/generate_multitype_flashcards")
def generate_multitype_flashcards_api(
    request: Request,
    body: MultitypeFlashcardRequest
):
    """
    Generate a flashcard for a given quiz questions using Together's chat completions.
    """
    
    client = request.app.state.together_client

    flashcards = generate_multitype_flashcards(
        body.video_id,
        body.time_stamp,
        body.context_seconds,
        language_code=body.language_code,
        client=client
    )

    return {"flashcards": flashcards}
