from fastapi import APIRouter, Query, Request, HTTPException
from helpers.graph import to_wikidata_item, transcript_to_item_descriptions
from helpers.helpers import fetch_transcript

router = APIRouter()


@router.get("/graph/to-wikidata-item")
def to_wikidata_item_endpoint(
    query: str = Query(..., description="The text query to convert to Wikidata items (e.g., 'Python')"),
    language: str = Query("en", description="Language code for the label (default: 'en')"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results to return (1-50, default: 10)")
):
    """
    Convert a text query to Wikidata items using semantic search.
    example: http://localhost:5173/api/graph/to-wikidata-item?query=Python&limit=5
    
    Args:
        query: The text query to convert to Wikidata items
        language: Language code for the label (default: "en")
        limit: Maximum number of results to return (1-50, default: 10)
    
    Returns:
        List of dictionaries containing Wikidata entity information for matching items.
    """
    results = to_wikidata_item(query, language, limit)
    
    return {
        "query": query,
        "count": len(results),
        "results": results
    }


@router.get("/graph/video-item-descriptions")
def video_item_descriptions_endpoint(
    request: Request,
    video_id: str = Query(..., description="YouTube video ID to extract transcript from"),
    model: str = Query("meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", description="Together model to use"),
    temperature: float = Query(0.7, ge=0.0, le=1.0, description="Sampling temperature (0.0-1.0)"),
    max_transcript_chars: int = Query(10000, ge=100, description="Maximum characters from transcript to process")
):
    """
    Extract a list of items/topics/concepts from a YouTube video transcript.
    example: GET /graph/video-item-descriptions?video_id=dQw4w9WgXcQ&temperature=0.7
    
    Args:
        video_id: YouTube video ID
        model: The Together model to use
        temperature: Sampling temperature (default: 0.7)
        max_transcript_chars: Maximum characters from transcript to send (default: 10000)
    
    Returns:
        List of strings, where each string is a 10-15 word description of an item/topic/concept
    """
    client = request.app.state.together_client
    
    # Fetch transcript
    fetched_transcript = fetch_transcript(video_id)
    
    # Convert to raw text
    text_parts = [snippet.text for snippet in fetched_transcript]
    transcript_text = " ".join(text_parts)
    
    try:
        items = transcript_to_item_descriptions(
            transcript_text,
            client=client,
            model=model,
            temperature=temperature,
            max_transcript_chars=max_transcript_chars
        )
        
        return {
            "video_id": video_id,
            "count": len(items),
            "items": items
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting items from transcript: {str(e)}"
        )


@router.get("/graph/video-to-wikidata-item")
def video_to_wikidata_item_endpoint(
    request: Request,
    video_id: str = Query(..., description="YouTube video ID to extract transcript from"),
    model: str = Query("meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", description="Together model to use"),
    temperature: float = Query(0.7, ge=0.0, le=1.0, description="Sampling temperature (0.0-1.0)"),
    max_transcript_chars: int = Query(10000, ge=100, description="Maximum characters from transcript to process"),
    language: str = Query("en", description="Language code for Wikidata labels (default: 'en')"),
    limit: int = Query(5, ge=1, le=10, description="Maximum number of Wikidata results per item (1-10, default: 5)")
):
    """
    Extract items/topics/concepts from a YouTube video transcript and find matching Wikidata items.
    First extracts item descriptions from the transcript, then searches Wikidata for each item.
    example: GET /graph/video-to-wikidata-item?video_id=dQw4w9WgXcQ&temperature=0.7&limit=5
    
    Args:
        video_id: YouTube video ID
        model: The Together model to use for extracting items
        temperature: Sampling temperature (default: 0.7)
        max_transcript_chars: Maximum characters from transcript to send (default: 10000)
        language: Language code for Wikidata labels (default: "en")
        limit: Maximum number of Wikidata results per item (default: 5)
    
    Returns:
        Dictionary with video_id, item descriptions, and Wikidata results for each item
    """
    client = request.app.state.together_client
    
    # Fetch transcript
    fetched_transcript = fetch_transcript(video_id)
    
    # Convert to raw text
    text_parts = [snippet.text for snippet in fetched_transcript]
    transcript_text = " ".join(text_parts)
    
    try:
        # Step 1: Extract item descriptions from transcript
        item_descriptions = transcript_to_item_descriptions(
            transcript_text,
            client=client,
            model=model,
            temperature=temperature,
            max_transcript_chars=max_transcript_chars
        )
        
        # Step 2: Search Wikidata for each item description
        results = []
        for item_desc in item_descriptions:
            wikidata_items = to_wikidata_item(item_desc, language=language, limit=limit)
            results.append({
                "item_description": item_desc,
                "wikidata_count": len(wikidata_items),
                "wikidata_items": wikidata_items
            })
        
        return {
            "video_id": video_id,
            "item_descriptions_count": len(item_descriptions),
            "results": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing video to Wikidata items: {str(e)}"
        )


@router.get("/graph")
def get_graph():
    """
    Graph-related endpoints info.
    """
    return {
        "message": "Graph endpoints available",
        "endpoints": {
            "/graph/to-wikidata-item": "Convert text queries to Wikidata items using semantic search",
            "/graph/video-item-descriptions": "Extract items/topics/concepts from a YouTube video transcript",
            "/graph/video-to-wikidata-item": "Extract items from video transcript and find matching Wikidata items"
        }
    }

