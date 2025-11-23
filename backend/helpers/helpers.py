import json
from fastapi import HTTPException
from youtube_transcript_api import YouTubeTranscriptApi
from typing import Optional, TYPE_CHECKING
import os
if TYPE_CHECKING:
    from youtube_transcript_api._types import FetchedTranscript


def fetch_transcript(video_id: str, language_code: Optional[str] = None) -> "FetchedTranscript":
    """
    Helper function to fetch transcript from YouTube.
    
    Args:
        video_id: YouTube video ID
        language_code: Optional language code
    
    Returns:
        FetchedTranscript object
    
    Raises:
        HTTPException: If transcript cannot be fetched
    """
    file_path = f"transcript_{video_id}.json"

    # 1. Try to use cache
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            # Cache is corrupted; delete and regenerate
            os.remove(file_path)

    try:
        ytt_api = YouTubeTranscriptApi()
        
        if language_code:
            fetched_transcript = ytt_api.fetch(video_id)
        else:
            fetched_transcript = ytt_api.fetch(video_id)
        
        return fetched_transcript
    except Exception as e:
        error_message = str(e)
        if "No transcripts were found" in error_message or "could not retrieve a transcript" in error_message:
            raise HTTPException(
                status_code=404,
                detail=f"No transcripts found for video ID: {video_id}. The video may not have captions available."
            )
        elif "Video unavailable" in error_message or "could not retrieve a video" in error_message:
            raise HTTPException(
                status_code=404,
                detail=f"Video not found: {video_id}. Please check the video ID."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching transcript: {error_message}"
            )

