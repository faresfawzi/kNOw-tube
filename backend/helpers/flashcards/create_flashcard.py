"""
Utilities for generating flashcards from quiz responses with Together's GPT-OSS models.
"""

from __future__ import annotations

import json
import random
from typing import Mapping, Sequence, Union

from together import Together

from .flashcard_prompts import get_prompt_generate_qa_flashcards

DEFAULT_MODEL = "openai/gpt-oss-120b"



def _response_text(response) -> str:
    try:
        return response.choices[0].message.content
    except (AttributeError, IndexError, KeyError) as exc:
        raise RuntimeError("Together chat completion response missing content.") from exc


def generate_flashcards(
    quiz_questions_with_wrong_answers: str,
    temperature: float = 0.3,
    model: str = DEFAULT_MODEL,
    *,
    client: Together,
) -> dict:
    prompt = get_prompt_generate_qa_flashcards(quiz_questions_with_wrong_answers)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": prompt},
        ],
        temperature=temperature
    )

    flashcards_text = _response_text(response)
    if flashcards_text.startswith("```json"):
        flashcards_text = "\n".join(flashcards_text.splitlines()[1:-1])

    try:
        json_object = json.loads(flashcards_text)
        return json_object
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Together response was not valid JSON. Inspect flashcards_text for debugging."
        ) from exc
