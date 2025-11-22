from fastapi import APIRouter, Query
import os
from typing import Optional
from helpers.helpers import fetch_transcript
import json
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
    # fetched_transcript = fetch_transcript(video_id, language_code)
    
    # # Convert to raw data format (list of dictionaries)
    # transcript_data = fetched_transcript.to_raw_data()
    
    # transcript_dict = {
    #     "video_id": fetched_transcript.video_id,
    #     "language": fetched_transcript.language,
    #     "language_code": fetched_transcript.language_code,
    #     "is_generated": fetched_transcript.is_generated,
    #     "transcript": transcript_data,
    #     "total_segments": len(fetched_transcript)
    # }


    file_path = f"transcript_{video_id}.json"

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    # If file doesn't exist, fetch from YouTube
    try:
        # fetch_transcript returns the transcript list (list of dicts)
        transcript_data = fetch_transcript(video_id, language_code)
        
        # Construct the dictionary with metadata
        # Note: We are using defaults for metadata since fetch_transcript (as implemented in helpers.py) 
        # might not return full metadata.
        transcript_dict = {
            "video_id": video_id,
            "language": "English (auto-generated)", # Placeholder
            "language_code": language_code or "en",
            "is_generated": True, # Placeholder
            "transcript": transcript_data,
            "total_segments": len(transcript_data) if transcript_data else 0
        }

        # Save to file for caching
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(transcript_dict, f, indent=4)

        return transcript_dict

    except Exception as e:
        print(f"Error fetching transcript: {e}")
        raise e
