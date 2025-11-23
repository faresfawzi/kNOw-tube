import os
import json
from typing import Optional
from helpers.helpers import fetch_transcript

def get_transcript(
    video_id: str,
    language_code: Optional[str] = None,
):
    file_path = f"transcript_{video_id}.json"

    # 1. Try to use cache
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            # Cache is corrupted; delete and regenerate
            os.remove(file_path)

    # 2. Fetch from YouTube
    fetched_transcript = fetch_transcript(video_id, language_code)

    # Convert to raw data
    transcript_data = fetched_transcript.to_raw_data()

    transcript_dict = {
        "video_id": fetched_transcript.video_id,
        "language": fetched_transcript.language,
        "language_code": fetched_transcript.language_code,
        "is_generated": fetched_transcript.is_generated,
        "transcript": transcript_data,  # <-- KEEP AS LIST OF DICTS
        "total_segments": len(fetched_transcript),
    }

    # 3. Save valid JSON
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(transcript_dict, f, ensure_ascii=False, indent=4)

    return transcript_dict