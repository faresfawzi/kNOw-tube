from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from youtube_transcript_api import YouTubeTranscriptApi
from typing import Optional

app = FastAPI()

# --- CORS CONFIGURATION ---
# This allows your React app to talk to this backend without "Blocked by CORS" errors
origins = [
    "http://localhost:5173",  # Vite (React) default port
    "http://localhost:3000",  # Next.js default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# --- ROUTES ---
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"}

@app.get("/data")
def get_data():
    return {
        "users": [
            {"id": 1, "name": "Alice", "role": "Admin"},
            {"id": 2, "name": "Bob", "role": "User"},
        ]
    }

@app.get("/transcript")
def get_transcript(
    video_id: str = Query(..., description="YouTube video ID (e.g., 'dQw4w9WgXcQ')"),
    language_code: Optional[str] = Query(None, description="Language code (e.g., 'en', 'es'). Defaults to English if not provided.")
):
    """
    Fetch transcript for a YouTube video.
    
    Args:
        video_id: YouTube video ID (extract from URL: youtube.com/watch?v=VIDEO_ID)
        language_code: Optional language code. If not provided, defaults to English.
    
    Returns:
        Object containing the transcript data with text, start time, and duration for each segment,
        along with video metadata (language, language_code, is_generated).
    """
    try:
        ytt_api = YouTubeTranscriptApi()
        
        if language_code:
            fetched_transcript = ytt_api.fetch(video_id, language_codes=[language_code])
        else:
            fetched_transcript = ytt_api.fetch(video_id)
        
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


