"""
Utilities for generating flashcards from quiz responses with Together's GPT-OSS models.
"""

from __future__ import annotations

import json
import random
from typing import Mapping, Optional, Sequence, Union

from together import Together

from .flashcard_prompts import get_prompt_generate_multitype_flashcards, get_prompt_generate_qa_flashcards
from helpers.transcripts import get_transcript
DEFAULT_MODEL = "openai/gpt-oss-120b"



def _response_text(response) -> str:
    try:
        return response.choices[0].message.content
    except (AttributeError, IndexError, KeyError) as exc:
        raise RuntimeError("Together chat completion response missing content.") from exc

def select_context_window(transcript_payload, timestamp, context_seconds=30):
    """
    Return transcript segments that cover the last `context_seconds`
    before `timestamp`, including the segment that contains `timestamp`.
    """
    segments = transcript_payload.get("transcript", []) if isinstance(transcript_payload, dict) else transcript_payload
    if not segments:
        return []

    def _collect_backward(idx: int) -> list:
        window = []
        remaining = context_seconds
        while idx >= 0:
            seg = segments[idx]
            window.append(seg)
            remaining = max(0, remaining - seg["duration"])
            if remaining <= 0:
                break
            idx -= 1
        return list(reversed(window))

    def _collect_forward(idx: int) -> list:
        window = []
        remaining = context_seconds
        while idx < len(segments) and remaining > 0:
            seg = segments[idx]
            window.append(seg)
            remaining = max(0, remaining - seg["duration"])
            if remaining <= 0:
                break
            idx += 1
        return window

    video_start = segments[0]["start"]
    video_end = segments[-1]["start"] + segments[-1]["duration"]

    if timestamp <= video_start:
        return _collect_forward(0)
    if timestamp >= video_end:
        return _collect_backward(len(segments) - 1)

    # Find segment that contains the timestamp, or the next closest one
    target_idx = None
    for i, seg in enumerate(segments):
        start = seg["start"]
        end = start + seg["duration"]
        if start <= timestamp <= end:
            target_idx = i
            break
        if timestamp < start:
            target_idx = i
            break

    if target_idx is None:
        target_idx = len(segments) - 1

    return _collect_backward(target_idx)


def generate_multitype_flashcards(
    video_id: str,
    time_stamp: float = 0.0,
    context_seconds: int = 30,
    language_code: Optional[str] = None,
    temperature: float = 0.3,
    model: str = DEFAULT_MODEL,
    *,
    client: Together,
) -> dict:
    
    transcript_payload = get_transcript(video_id=video_id, language_code=language_code)
    transcript_section = select_context_window(transcript_payload, time_stamp, context_seconds)
    prompt = get_prompt_generate_multitype_flashcards(str(transcript_section))

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


def _transcript_text(transcript_payload, max_chars: int = 8_000) -> str:
    """Collapse transcript list into plaintext for QA prompts."""
    segments = transcript_payload.get("transcript", []) if isinstance(transcript_payload, dict) else transcript_payload
    text_parts = [str(chunk.get("text", "")).strip() for chunk in segments if isinstance(chunk, Mapping)]
    text = " ".join(filter(None, text_parts))
    if len(text) > max_chars:
        return f"{text[:max_chars]}..."
    return text


def generate_qa_flashcards(
    quiz_questions_with_wrong_answers: str,
    video_id: str,
    language_code: Optional[str] = None,
    temperature: float = 0.3,
    model: str = DEFAULT_MODEL,
    *,
    client: Together,
) -> dict:
    transcript_payload = get_transcript(video_id=video_id, language_code=language_code)
    transcript_context = _transcript_text(transcript_payload)
    prompt = get_prompt_generate_qa_flashcards(quiz_questions_with_wrong_answers)
    if transcript_context:
        prompt = f"{prompt}\n\nVideo Transcript Context:\n{transcript_context}"

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
