from typing import Optional, Any

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from helpers.helpers import fetch_transcript
from helpers.flashcards.create_flashcard import generate_flashcards

router = APIRouter()

class FlashcardRequest(BaseModel):
    quiz_questions_with_wrong_answers: Any

@router.post("/generate_flashcards")
def generate_flashcards_api(
    request: Request,
    body: FlashcardRequest
):
    """
    Generate a flashcard for a given quiz questions using Together's chat completions.
    """
    
    client = request.app.state.together_client

    flashcards = generate_flashcards(
        body.quiz_questions_with_wrong_answers,
        client=client
    )

    return {"flashcards": flashcards}
