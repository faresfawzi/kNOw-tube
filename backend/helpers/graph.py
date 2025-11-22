import httpx
import logging
import json
from typing import Dict, Any, List, TYPE_CHECKING

if TYPE_CHECKING:
    from together import Together

logger = logging.getLogger(__name__)

# Wikidata semantic search API endpoint (note: trailing slash required)
WIKIDATA_SEMANTIC_SEARCH_URL = "https://wd-vectordb.wmcloud.org/item/query/"
# Wikidata MediaWiki API endpoint for fetching entity details
WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php"
# User-Agent required by Wikidata API policy
USER_AGENT = "kNOw-tube/1.0 (https://github.com/yourusername/kNOw-tube; contact@example.com) Python/httpx"


def _fetch_labels_and_descriptions(qids: list[str], language: str = "en") -> Dict[str, Dict[str, str]]:
    """
    Fetch labels and descriptions for multiple Wikidata QIDs.
    
    Args:
        qids: List of QIDs to fetch labels/descriptions for
        language: Language code for the labels/descriptions
    
    Returns:
        Dictionary mapping QID to {"label": "...", "description": "..."}
    """
    if not qids:
        return {}
    
    try:
        # Join QIDs with | for the API
        ids_param = "|".join(qids)
        
        params = {
            "action": "wbgetentities",
            "ids": ids_param,
            "props": "labels|descriptions",
            "languages": language,
            "format": "json"
        }
        
        headers = {
            "User-Agent": USER_AGENT
        }
        
        timeout = httpx.Timeout(30.0, connect=10.0)
        
        with httpx.Client(follow_redirects=True, timeout=timeout) as client:
            response = client.get(WIKIDATA_API_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
        
        result = {}
        if "entities" in data:
            for qid, entity_data in data["entities"].items():
                label = ""
                description = ""
                
                if "labels" in entity_data and language in entity_data["labels"]:
                    label = entity_data["labels"][language].get("value", "")
                
                if "descriptions" in entity_data and language in entity_data["descriptions"]:
                    description = entity_data["descriptions"][language].get("value", "")
                
                result[qid] = {
                    "label": label,
                    "description": description
                }
        
        return result
    except Exception as e:
        logger.warning(f"Error fetching labels/descriptions for QIDs: {str(e)}")
        return {}




def to_wikidata_item(query: str, language: str = "en", limit: int = 10) -> list[Dict[str, Any]]:
    """
    Convert a text query to Wikidata items using semantic search.
    Uses Wikidata's semantic search API (vector similarity) for better concept matching.
    
    Args:
        query: The text query to search for
        language: Language code for the label (default: "en")
        limit: Maximum number of results to return (default: 10)
    
    Returns:
        List of dictionaries containing Wikidata entity information with similarity scores
    """
    try:
        params = {
            "query": query,
            "lang": language,
            "K": limit
        }
        
        logger.debug(f"Semantic search for Wikidata items matching: '{query}' (language: {language}, limit: {limit})")
        
        headers = {
            "User-Agent": USER_AGENT
        }
        
        # Set longer timeout for semantic search API (30 seconds)
        timeout = httpx.Timeout(30.0, connect=10.0)
        
        with httpx.Client(follow_redirects=True, timeout=timeout) as client:
            response = client.get(WIKIDATA_SEMANTIC_SEARCH_URL, params=params, headers=headers)
            logger.debug(f"Wikidata semantic search API response status: {response.status_code}")
            response.raise_for_status()
            data = response.json()
        
        entities = []
        if isinstance(data, list):
            logger.debug(f"Found {len(data)} results in semantic search")
            
            # Extract all QIDs first
            qids = []
            for entity in data:
                qid = entity.get("QID") or entity.get("qid") or entity.get("id")
                if qid:
                    qids.append(qid)
            
            # Fetch labels and descriptions for all QIDs in one batch
            labels_descriptions = _fetch_labels_and_descriptions(qids, language) if qids else {}
            
            # Build entities with labels and descriptions
            for entity in data:
                qid = entity.get("QID") or entity.get("qid") or entity.get("id")
                similarity_score = entity.get("similarity_score", 0.0)
                rrf_score = entity.get("rrf_score", 0.0)
                source = entity.get("source", "")
                
                # Get label and description from the fetched data
                entity_info = labels_descriptions.get(qid, {})
                label = entity_info.get("label", "")
                description = entity_info.get("description", "")
                
                entities.append({
                    "qid": qid,
                    "label": label,
                    "description": description,
                    "similarity_score": similarity_score,
                    "rrf_score": rrf_score,
                    "source": source,
                    "uri": f"http://www.wikidata.org/entity/{qid}" if qid else None,
                    "full_entity": entity
                })
            logger.info(f"Successfully found {len(entities)} Wikidata items matching '{query}'")
        else:
            logger.warning(f"Unexpected response structure from Wikidata semantic search API. Type: {type(data)}")
        
        return entities
    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP error while searching Wikidata for '{query}': "
            f"Status {e.response.status_code}, Response: {e.response.text[:200]}"
        )
        return []
    except httpx.RequestError as e:
        logger.error(
            f"Request error while searching Wikidata for '{query}': {str(e)}"
        )
        return []
    except Exception as e:
        logger.error(
            f"Unexpected error while searching Wikidata for '{query}': {type(e).__name__}: {str(e)}",
            exc_info=True
        )
        return []


def transcript_to_item_descriptions(
    transcript: str,
    *,
    client: "Together",
    model: str = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    temperature: float = 0.7,
    max_transcript_chars: int = 10000,
) -> List[str]:
    """
    Extract a list of items/topics/concepts from a transcript, where each item
    is a 10-15 word description.
    
    Args:
        transcript: The transcript text string
        client: Together API client instance
        model: The model to use for completion (default: meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo)
        temperature: Sampling temperature (default: 0.7)
        max_transcript_chars: Maximum characters from transcript to send (default: 10000)
    
    Returns:
        List of strings, where each string is a 10-15 word description of an item/topic/concept
    """
    # Truncate transcript if too long
    if len(transcript) > max_transcript_chars:
        transcript = transcript[:max_transcript_chars]
        logger.debug(f"Truncated transcript to {max_transcript_chars} characters")
    
    prompt = f"""Analyze the following transcript and extract a list of key items, topics, or concepts discussed.

For each item/topic/concept, provide a 10-15 word description that clearly explains what it is.

Return your response as a JSON array of strings, where each string is a 10-15 word description of an item/topic/concept.

Transcript:
{transcript}

Return only the JSON array, no additional text or explanation."""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
        )
        
        # Extract the response text
        response_text = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = "\n".join(response_text.splitlines()[1:-1])
        elif response_text.startswith("```"):
            response_text = "\n".join(response_text.splitlines()[1:-1])
        
        # Parse JSON
        try:
            items = json.loads(response_text)
            if not isinstance(items, list):
                logger.warning(f"Expected list but got {type(items)}, wrapping in list")
                items = [items] if items else []
            
            # Validate that items are strings
            validated_items = []
            for item in items:
                if isinstance(item, str):
                    validated_items.append(item)
                else:
                    logger.warning(f"Skipping non-string item: {item}")
            
            logger.info(f"Successfully extracted {len(validated_items)} items from transcript")
            return validated_items
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            # Try to extract items from plain text (fallback)
            lines = [line.strip() for line in response_text.splitlines() if line.strip()]
            return lines[:20]  # Return first 20 lines as fallback
            
    except Exception as e:
        logger.error(f"Error calling Together API: {type(e).__name__}: {str(e)}", exc_info=True)
        raise

