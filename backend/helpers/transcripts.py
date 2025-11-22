from fastapi import APIRouter, Query
from typing import Optional
from helpers import fetch_transcript
def get_transcript(
    video_id: str = Query(..., description="YouTube video ID (e.g., 'dQw4w9WgXcQ')"),
    language_code: Optional[str] = Query(None, description="Language code (e.g., 'en', 'es'). Defaults to English if not provided.")
):
    """
    Fetch transcript for a YouTube video.
    example: http://localhost:5173/api/transcript?video_id=RBmOgQi4Fr0
    
    Args:
        video_id: YouTube video ID (extract from URL: youtube.com/watch?v=VIDEO_ID)
        language_code: Optional language code. If not provided, defaults to English.
    
    Returns:
        Object containing the transcript data with text, start time, and duration for each segment,
        along with video metadata (language, language_code, is_generated).
    """
    fetched_transcript = fetch_transcript(video_id, language_code)
    
    # Convert to raw data format (list of dictionaries)
    transcript_data = fetched_transcript.to_raw_data()
    
    return {
        "video_id": fetched_transcript.video_id,
        "language": fetched_transcript.language,
        "language_code": fetched_transcript.language_code,
        "is_generated": fetched_transcript.is_generated,
        "transcript": transcript_data,
        "total_segments": len(fetched_transcript)
    }