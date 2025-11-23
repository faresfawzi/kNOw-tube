from fastapi import APIRouter, Query, Request, HTTPException
from helpers.graph import transcript_to_item_descriptions
from helpers.helpers import fetch_transcript

router = APIRouter()

MODEL = "openai/gpt-oss-120b"


# @router.get("/graph/to-wikidata-item")
# def to_wikidata_item_endpoint(
#     query: str = Query(..., description="The text query to convert to Wikidata items (e.g., 'Python')"),
#     language: str = Query("en", description="Language code for the label (default: 'en')"),
#     limit: int = Query(10, ge=1, le=50, description="Maximum number of results to return (1-50, default: 10)"),
#     categories_only: bool = Query(True, description="If True, only return entities that are categories (default: False)")
# ):
#     """
#     Convert a text query to Wikidata items using semantic search.
#     example: http://localhost:5173/api/graph/to-wikidata-item?query=Python&limit=5
    
#     Args:
#         query: The text query to convert to Wikidata items
#         language: Language code for the label (default: "en")
#         limit: Maximum number of results to return (1-50, default: 10)
    
#     Returns:
#         List of dictionaries containing Wikidata entity information for matching items.
#     """
#     results = to_wikidata_item(query, language, limit, categories_only=categories_only)
    
#     return {
#         "query": query,
#         "count": len(results),
#         "results": results
#     }


@router.get("/graph/video-item-descriptions")
def video_item_descriptions_endpoint(
    request: Request,
    video_id: str = Query(..., description="YouTube video ID to extract transcript from"),
    model: str = Query(MODEL, description="Together model to use"),
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
    print(f"[DEBUG] video-item-descriptions: Starting with video_id={video_id}, model={model}, temperature={temperature}")
    client = request.app.state.together_client
    print(f"[DEBUG] Got together_client: {client is not None}")
    
    # Fetch transcript
    print(f"[DEBUG] Fetching transcript for video_id: {video_id}")
    # fetched_transcript = fetch_transcript(video_id)
    # print(f"[DEBUG] Fetched {len(fetched_transcript)} transcript snippets")

    # # Convert to raw text
    # text_parts = [snippet.text for snippet in fetched_transcript]
    # transcript_text = " ".join(text_parts)
    # print(f"[DEBUG] Transcript text length: {len(transcript_text)} characters")
    # print(f"[DEBUG] Transcript preview (first 200 chars): {transcript_text[:200]}")
    transcript_text = "dsuahdiuashidajshosdjsaoidjasoidjoasda"
    try:
        print(f"[DEBUG] Calling transcript_to_item_descriptions with model={model}, temperature={temperature}, max_transcript_chars={max_transcript_chars}")
        items = transcript_to_item_descriptions(
            transcript_text,
            client=client,
            model=model,
            temperature=temperature,
            max_transcript_chars=max_transcript_chars
        )
        print(f"[DEBUG] Got {len(items)} items from transcript_to_item_descriptions")
        print(f"[DEBUG] Items: {items}")
        
        return {
            "video_id": video_id,
            "count": len(items),
            "items": items
        }
    except Exception as e:
        print(f"[DEBUG] ERROR in video-item-descriptions: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting items from transcript: {str(e)}"
        )


# @router.get("/graph/video-to-wikidata-item")
# def video_to_wikidata_item_endpoint(
#     request: Request,
#     video_id: str = Query(..., description="YouTube video ID to extract transcript from"),
#     model: str = Query(MODEL, description="Together model to use"),
#     temperature: float = Query(0.7, ge=0.0, le=1.0, description="Sampling temperature (0.0-1.0)"),
#     max_transcript_chars: int = Query(10000, ge=100, description="Maximum characters from transcript to process"),
#     language: str = Query("en", description="Language code for Wikidata labels (default: 'en')"),
#     limit: int = Query(5, ge=1, le=10, description="Maximum number of Wikidata results per item (1-10, default: 5)")
# ):
#     """
#     Extract items/topics/concepts from a YouTube video transcript and find matching Wikidata items.
#     First extracts item descriptions from the transcript, then searches Wikidata for each item.
#     example: GET /graph/video-to-wikidata-item?video_id=dQw4w9WgXcQ&temperature=0.7&limit=5
    
#     Args:
#         video_id: YouTube video ID
#         model: The Together model to use for extracting items
#         temperature: Sampling temperature (default: 0.7)
#         max_transcript_chars: Maximum characters from transcript to send (default: 10000)
#         language: Language code for Wikidata labels (default: "en")
#         limit: Maximum number of Wikidata results per item (default: 5)
    
#     Returns:
#         Dictionary with video_id, item descriptions, and Wikidata results for each item
#     """
#     print(f"[DEBUG] video-to-wikidata-item: Starting with video_id={video_id}, model={model}, temperature={temperature}, language={language}, limit={limit}")
#     client = request.app.state.together_client
#     print(f"[DEBUG] Got together_client: {client is not None}")
    
#     # Fetch transcript
#     print(f"[DEBUG] Fetching transcript for video_id: {video_id}")
#     fetched_transcript = fetch_transcript(video_id)
#     print(f"[DEBUG] Fetched {len(fetched_transcript)} transcript snippets")
    
#     # Convert to raw text
#     text_parts = [snippet.text for snippet in fetched_transcript]
#     transcript_text = " ".join(text_parts)
#     print(f"[DEBUG] Transcript text length: {len(transcript_text)} characters")
#     print(f"[DEBUG] Transcript preview (first 200 chars): {transcript_text[:200]}")
    
#     try:
#         # Step 1: Extract item descriptions from transcript
#         print(f"[DEBUG] Step 1: Calling transcript_to_item_descriptions with model={model}, temperature={temperature}, max_transcript_chars={max_transcript_chars}")
#         item_descriptions = transcript_to_item_descriptions(
#             transcript_text,
#             client=client,
#             model=model,
#             temperature=temperature,
#             max_transcript_chars=max_transcript_chars
#         )
#         print(f"[DEBUG] Step 1 complete: Got {len(item_descriptions)} item descriptions")
#         print(f"[DEBUG] Item descriptions: {item_descriptions}")
        
#         # Step 2: Search Wikidata for each item description
#         print(f"[DEBUG] Step 2: Searching Wikidata for {len(item_descriptions)} items")
#         results = []
#         for idx, item_obj in enumerate(item_descriptions):
#             # Use description for Wikidata search, or fallback to concepts if description is not available
#             search_query = item_obj.get("description", item_obj.get("concepts", ""))
#             print(f"[DEBUG] Searching Wikidata for item {idx+1}/{len(item_descriptions)}: {item_obj.get('concepts', 'Unknown')}")
#             wikidata_items = to_wikidata_item(search_query, language=language, limit=limit, categories_only=True)
#             print(f"[DEBUG] Found {len(wikidata_items)} Wikidata items for item {idx+1}")
#             results.append({
#                 "concepts": item_obj.get("concepts", ""),
#                 "description": item_obj.get("description", ""),
#                 "context": item_obj.get("context", ""),
#                 "wikidata_count": len(wikidata_items),
#                 "wikidata_items": wikidata_items
#             })
        
#         print(f"[DEBUG] Complete: Returning {len(results)} results")
#         return {
#             "video_id": video_id,
#             "item_descriptions_count": len(item_descriptions),
#             "results": results
#         }
#     except Exception as e:
#         print(f"[DEBUG] ERROR in video-to-wikidata-item: {type(e).__name__}: {str(e)}")
#         import traceback
#         print(f"[DEBUG] Traceback: {traceback.format_exc()}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error processing video to Wikidata items: {str(e)}"
#         )


@router.get("/graph")
def get_graph():
    """
    Graph-related endpoints info.
    """
    return {
        "message": "Graph endpoints available",
        "endpoints": {
            # "/graph/to-wikidata-item": "Convert text queries to Wikidata items using semantic search",
            "/graph/video-item-descriptions": "Extract items/topics/concepts from a YouTube video transcript",
            # "/graph/video-to-wikidata-item": "Extract items from video transcript and find matching Wikidata items"
        }
    }

