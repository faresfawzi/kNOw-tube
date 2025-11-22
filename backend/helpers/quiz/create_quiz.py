"""
Utilities for generating quizzes from video transcripts with Together's GPT-OSS models.
"""

from __future__ import annotations

import json
import random
from typing import Mapping, Optional, Sequence, Union

from together import Together

from .quiz_prompts import get_prompt_generate_quiz_questions
from helpers.transcripts import get_transcript

DEFAULT_MODEL = "moonshotai/Kimi-K2-Instruct-0905"


def _collapse_transcript_text(
    transcript: Union[str, Mapping[str, str], Sequence[Union[str, Mapping[str, str]]]],
    max_chars: int = 8_000,
) -> str:
    """
    Convert a transcript payload (string or list of transcript segments) into text.
    """

    def _extract_text(entry: Union[str, Mapping[str, str]]) -> str:
        if isinstance(entry, str):
            return entry.strip()
        if isinstance(entry, Mapping):
            return str(entry.get("text", "")).strip()
        raise TypeError(
            "Each transcript entry must be a string or a mapping containing 'text'."
        )

    if isinstance(transcript, str):
        text = transcript.strip()
    elif isinstance(transcript, Mapping):
        text = str(transcript.get("text", "")).strip()
    elif isinstance(transcript, Sequence):
        text = " ".join(filter(None, (_extract_text(chunk) for chunk in transcript)))
    else:
        raise TypeError(
            "transcript must be a string, mapping, or sequence of transcript segments."
        )

    if not text:
        raise ValueError("Transcript text is empty.")

    if len(text) > max_chars:
        text = f"{text[:max_chars]}..."

    return text


def _build_prompt(transcript_text: str, difficulty_level: str) -> str:
    prompt = get_prompt_generate_quiz_questions(transcript_text, difficulty_level)
    return prompt


def _response_text(response) -> str:
    try:
        return response.choices[0].message.content
    except (AttributeError, IndexError, KeyError) as exc:
        raise RuntimeError("Together chat completion response missing content.") from exc


def generate_quiz_from_transcript(
    video_id: str,
    language_code: Optional[str] = None,
    temperature: float = 0.3,
    model: str = DEFAULT_MODEL,
    max_transcript_chars: int = 8_000,
    difficulty_level: str = "medium",
    *,
    client: Together,
) -> dict:
    """
    Create a quiz from a transcript using Together's chat completion API.

    Args:
        video_id: YouTube video identifier to fetch transcript for.
        language_code: Optional language override when fetching the transcript.
        temperature: Sampling temperature for the completion.
        model: GPT model identifier (defaults to openai/gpt-oss-20b).
        max_transcript_chars: Max characters from the transcript to send to the model.
        max_output_tokens: Token cap for the response.
        difficulty_level: Difficulty descriptor passed to the quiz prompt helper.
        client: Together client that will execute the completion.

    Returns:
        Parsed quiz dictionary (matching the schema defined in quiz_prompts.py).
    """
    transcript_payload = get_transcript(video_id=video_id, language_code=language_code)
    transcript_text = _collapse_transcript_text(
        transcript_payload.get("transcript", []), max_chars=max_transcript_chars
    )
    prompt = _build_prompt(transcript_text, difficulty_level)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        # max_tokens=max_output_tokens,
    )

    quiz_text = _response_text(response)
    if quiz_text.startswith("```json"):
        quiz_text = "\n".join(quiz_text.splitlines()[1:-1])

    try:
        json_object = json.loads(quiz_text)
        if len(json_object) != 15:
            raise RuntimeError(
                f"Expected 15 quiz questions, but got {len(json_object)}. Inspect quiz_text for debugging."
            )
        if difficulty_level == "easy":
            json_object = json_object[:5]
        elif difficulty_level == "medium":
            json_object = json_object[5:10]
        elif difficulty_level == "hard":
            json_object = json_object[10:15]
        return random.sample(json_object, len(json_object))
    except json.JSONDecodeError as exc:
        # Save quiz_text for debugging
        with open("quiz_debug.txt", "w", encoding="utf-8") as debug_file:
            debug_file.write(quiz_text)
        raise RuntimeError(
            "Together response was not valid JSON. Inspect quiz_text for debugging." + quiz_text
        ) from exc
