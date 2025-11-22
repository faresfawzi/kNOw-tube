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


# def _check_are_categories(qids: list[str]) -> Dict[str, bool]:
#     """
#     Check if Wikidata entities are categories by examining their instance-of (P31) properties.
    
#     Args:
#         qids: List of QIDs to check
    
#     Returns:
#         Dictionary mapping QID to boolean (True if category, False otherwise)
#     """
#     if not qids:
#         return {}
    
#     try:
#         # Join QIDs with | for the API
#         ids_param = "|".join(qids)
        
#         params = {
#             "action": "wbgetentities",
#             "ids": ids_param,
#             "props": "claims",
#             "format": "json"
#         }
        
#         headers = {
#             "User-Agent": USER_AGENT
#         }
        
#         timeout = httpx.Timeout(30.0, connect=10.0)
        
#         with httpx.Client(follow_redirects=True, timeout=timeout) as client:
#             response = client.get(WIKIDATA_API_URL, params=params, headers=headers)
#             response.raise_for_status()
#             data = response.json()
        
#         result = {}
#         # Wikidata category QID: Q4167836 (Category)
#         category_qids = {"Q4167836"}  # Category
        
#         if "entities" in data:
#             for qid, entity_data in data["entities"].items():
#                 is_category = False
                
#                 # Check instance of (P31) claims
#                 if "claims" in entity_data and "P31" in entity_data["claims"]:
#                     for claim in entity_data["claims"]["P31"]:
#                         if "mainsnak" in claim and "datavalue" in claim["mainsnak"]:
#                             datavalue = claim["mainsnak"]["datavalue"]
#                             if datavalue.get("type") == "wikibase-entityid":
#                                 entity_id = datavalue.get("value", {}).get("id", "")
#                                 if entity_id in category_qids:
#                                     is_category = True
#                                     break
                
#                 result[qid] = is_category
        
#         return result
#     except Exception as e:
#         logger.warning(f"Error checking categories for QIDs: {str(e)}")
#         return {qid: False for qid in qids}


# def _find_category_for_entities(qids: list[str]) -> Dict[str, str]:
#     """
#     Find category/parent entities for non-category entities.
#     For entities that are already categories, returns the same QID.
#     For non-categories, tries to find a related category through P31 (instance of), 
#     P279 (subclass of), or P910 (topic's main category).
    
#     Args:
#         qids: List of QIDs to find categories for
    
#     Returns:
#         Dictionary mapping original QID to category QID (or original QID if already a category or no category found)
#     """
#     if not qids:
#         return {}
    
#     try:
#         # First check which are already categories
#         category_map = _check_are_categories(qids)
        
#         # Join QIDs with | for the API
#         ids_param = "|".join(qids)
        
#         params = {
#             "action": "wbgetentities",
#             "ids": ids_param,
#             "props": "claims",
#             "format": "json"
#         }
        
#         headers = {
#             "User-Agent": USER_AGENT
#         }
        
#         timeout = httpx.Timeout(30.0, connect=10.0)
        
#         with httpx.Client(follow_redirects=True, timeout=timeout) as client:
#             response = client.get(WIKIDATA_API_URL, params=params, headers=headers)
#             response.raise_for_status()
#             data = response.json()
        
#         result = {}
#         category_qids = {"Q4167836"}  # Category
        
#         if "entities" in data:
#             for qid, entity_data in data["entities"].items():
#                 # If already a category, return itself
#                 if category_map.get(qid, False):
#                     result[qid] = qid
#                     continue
                
#                 # Try to find a category through various properties
#                 category_found = None
                
#                 # Priority order: P910 (topic's main category), P31 (instance of), P279 (subclass of)
#                 property_order = ["P910", "P31", "P279"]
                
#                 # Collect all related QIDs first, then check them in batch
#                 related_qids = []
#                 for prop_id in property_order:
#                     if "claims" in entity_data and prop_id in entity_data["claims"]:
#                         for claim in entity_data["claims"][prop_id]:
#                             if "mainsnak" in claim and "datavalue" in claim["mainsnak"]:
#                                 datavalue = claim["mainsnak"]["datavalue"]
#                                 if datavalue.get("type") == "wikibase-entityid":
#                                     related_qid = datavalue.get("value", {}).get("id", "")
#                                     if related_qid:
#                                         related_qids.append((prop_id, related_qid))
                
#                 # Check related entities in batch if any found
#                 if related_qids:
#                     # Check in priority order
#                     for prop_id in property_order:
#                         related_for_prop = [qid for p, qid in related_qids if p == prop_id]
#                         if related_for_prop:
#                             related_category_map = _check_are_categories(related_for_prop)
#                             # Find first category in this property's related entities
#                             for prop, qid in related_qids:
#                                 if prop == prop_id and related_category_map.get(qid, False):
#                                     category_found = qid
#                                     break
#                             if category_found:
#                                 break
                
#                 # Return found category, or original QID if none found
#                 result[qid] = category_found if category_found else qid
        
#         return result
#     except Exception as e:
#         logger.warning(f"Error finding categories for QIDs: {str(e)}")
#         return {qid: qid for qid in qids}  # Return original QIDs on error


# def _fetch_labels_and_descriptions(qids: list[str], language: str = "en") -> Dict[str, Dict[str, str]]:
#     """
#     Fetch labels and descriptions for multiple Wikidata QIDs.
    
#     Args:
#         qids: List of QIDs to fetch labels/descriptions for
#         language: Language code for the labels/descriptions
    
#     Returns:
#         Dictionary mapping QID to {"label": "...", "description": "..."}
#     """
#     if not qids:
#         return {}
    
#     try:
#         # Join QIDs with | for the API
#         ids_param = "|".join(qids)
        
#         params = {
#             "action": "wbgetentities",
#             "ids": ids_param,
#             "props": "labels|descriptions",
#             "languages": language,
#             "format": "json"
#         }
        
#         headers = {
#             "User-Agent": USER_AGENT
#         }
        
#         timeout = httpx.Timeout(30.0, connect=10.0)
        
#         with httpx.Client(follow_redirects=True, timeout=timeout) as client:
#             response = client.get(WIKIDATA_API_URL, params=params, headers=headers)
#             response.raise_for_status()
#             data = response.json()
        
#         result = {}
#         if "entities" in data:
#             for qid, entity_data in data["entities"].items():
#                 label = ""
#                 description = ""
                
#                 if "labels" in entity_data and language in entity_data["labels"]:
#                     label = entity_data["labels"][language].get("value", "")
                
#                 if "descriptions" in entity_data and language in entity_data["descriptions"]:
#                     description = entity_data["descriptions"][language].get("value", "")
                
#                 result[qid] = {
#                     "label": label,
#                     "description": description
#                 }
        
#         return result
#     except Exception as e:
#         logger.warning(f"Error fetching labels/descriptions for QIDs: {str(e)}")
#         return {}


# def to_wikidata_item(query: str, language: str = "en", limit: int = 10, categories_only: bool = False) -> list[Dict[str, Any]]:
#     """
#     Convert a text query to Wikidata items using semantic search.
#     Uses Wikidata's semantic search API (vector similarity) for better concept matching.
    
#     Args:
#         query: The text query to search for
#         language: Language code for the label (default: "en")
#         limit: Maximum number of results to return (default: 10)
#         categories_only: If True, only return entities that are categories (default: False)
    
#     Returns:
#         List of dictionaries containing Wikidata entity information with similarity scores
#     """
#     try:
#         params = {
#             "query": query,
#             "lang": language,
#             "K": limit
#         }
        
#         logger.debug(f"Semantic search for Wikidata items matching: '{query}' (language: {language}, limit: {limit}, categories_only: {categories_only})")
        
#         headers = {
#             "User-Agent": USER_AGENT
#         }
        
#         # Set longer timeout for semantic search API (30 seconds)
#         timeout = httpx.Timeout(30.0, connect=10.0)
        
#         with httpx.Client(follow_redirects=True, timeout=timeout) as client:
#             response = client.get(WIKIDATA_SEMANTIC_SEARCH_URL, params=params, headers=headers)
#             logger.debug(f"Wikidata semantic search API response status: {response.status_code}")
#             response.raise_for_status()
#             data = response.json()
        
#         entities = []
#         if isinstance(data, list):
#             logger.debug(f"Found {len(data)} results in semantic search")
            
#             # Extract all QIDs first
#             qids = []
#             for entity in data:
#                 qid = entity.get("QID") or entity.get("qid") or entity.get("id")
#                 if qid:
#                     qids.append(qid)
            
#             # If filtering for categories only, find categories for entities
#             category_mapping = {}
#             seen_categories = set()  # Track categories we've already added to avoid duplicates
#             is_category_map = {}  # Cache for category checks
#             use_category_filtering = categories_only
#             if categories_only and qids:
#                 try:
#                     # First check which entities are already categories
#                     is_category_map = _check_are_categories(qids)
#                     category_mapping = _find_category_for_entities(qids)
#                     # Collect unique category QIDs
#                     category_qids_to_fetch = set(category_mapping.values())
#                     logger.debug(f"Category mapping: {len(category_mapping)} entities mapped to {len(category_qids_to_fetch)} categories")
                    
#                     # Fetch labels and descriptions for category QIDs
#                     labels_descriptions = _fetch_labels_and_descriptions(list(category_qids_to_fetch), language) if category_qids_to_fetch else {}
#                 except Exception as e:
#                     logger.error(f"Error in category filtering: {type(e).__name__}: {str(e)}", exc_info=True)
#                     # Fall back to regular behavior if category filtering fails
#                     labels_descriptions = _fetch_labels_and_descriptions(qids, language) if qids else {}
#                     use_category_filtering = False  # Disable filtering on error
#             else:
#                 # Fetch labels and descriptions for all QIDs in one batch
#                 labels_descriptions = _fetch_labels_and_descriptions(qids, language) if qids else {}
            
#             # Build entities with labels and descriptions
#             for entity in data:
#                 original_qid = entity.get("QID") or entity.get("qid") or entity.get("id")
                
#                 if not original_qid:
#                     continue
                
#                 # If categories_only, use the mapped category QID instead
#                 if use_category_filtering:
#                     category_qid = category_mapping.get(original_qid, original_qid)
                    
#                     # Skip if no category was found (mapping returns original and it's not a category)
#                     is_original_category = is_category_map.get(original_qid, False)
#                     if category_qid == original_qid and not is_original_category:
#                         continue
                    
#                     # Skip if we've already added this category (avoid duplicates)
#                     if category_qid in seen_categories:
#                         continue
                    
#                     seen_categories.add(category_qid)
#                     qid = category_qid
#                 else:
#                     qid = original_qid
                
#                 similarity_score = entity.get("similarity_score", 0.0)
#                 rrf_score = entity.get("rrf_score", 0.0)
#                 source = entity.get("source", "")
                
#                 # Get label and description from the fetched data
#                 entity_info = labels_descriptions.get(qid, {})
#                 label = entity_info.get("label", "")
#                 description = entity_info.get("description", "")
                
#                 entities.append({
#                     "qid": qid,
#                     "label": label,
#                     "description": description,
#                     "similarity_score": similarity_score,
#                     "rrf_score": rrf_score,
#                     "source": source,
#                     "uri": f"http://www.wikidata.org/entity/{qid}" if qid else None,
#                     "full_entity": entity
#                 })
            
#             filter_msg = " (categories only)" if use_category_filtering else ""
#             logger.info(f"Successfully found {len(entities)} Wikidata items matching '{query}'{filter_msg}")
#         else:
#             logger.warning(f"Unexpected response structure from Wikidata semantic search API. Type: {type(data)}")
        
#         return entities
#     except httpx.HTTPStatusError as e:
#         logger.error(
#             f"HTTP error while searching Wikidata for '{query}': "
#             f"Status {e.response.status_code}, Response: {e.response.text[:200]}"
#         )
#         return []
#     except httpx.RequestError as e:
#         logger.error(
#             f"Request error while searching Wikidata for '{query}': {str(e)}"
#         )
#         return []
#     except Exception as e:
#         logger.error(
#             f"Unexpected error while searching Wikidata for '{query}': {type(e).__name__}: {str(e)}",
#             exc_info=True
#         )
#         return []


def transcript_to_item_descriptions(
    transcript: str,
    *,
    client: "Together",
    model: str = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    temperature: float = 0.7,
    max_transcript_chars: int = 20000,
) -> List[Dict[str, str]]:
    """
    Extract a list of key themes from a transcript as JSON objects suitable for semantic search with Wikidata.
    
    Args:
        transcript: The transcript text string
        client: Together API client instance
        model: The model to use for completion (default: meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo)
        temperature: Sampling temperature (default: 0.7)
        max_transcript_chars: Maximum characters from transcript to send (default: 20000)
    
    Returns:
        List of dictionaries, where each dictionary contains:
        - concepts: 1-3 words describing the key concept
        - description: ~50 words describing the concept
        - context: transcript context and related information for further subtopic generation
    """
    import re
    
    # Truncate transcript if too long
    if len(transcript) > max_transcript_chars:
        transcript = transcript[:max_transcript_chars]
        logger.debug(f"Truncated transcript to {max_transcript_chars} characters")
    
    prompt = f"""Analyze the transcript below. Extract key themes, topics, and concepts suitable for Wikidata semantic search.

Requirements:
1. Identify distinct, substantial conceptual themes.
2. For each theme, create a JSON object with:
   - "concepts": A concise 1-3 word phrase identifying the key concept
   - "description": A detailed description (approx. 50 words) that includes context and details
   - "context": Relevant transcript context and related information that could guide further generation of subtopics
3. Output MUST be a valid JSON Array of objects.

Example Output Format:
[
    {{
        "concepts": "Machine Learning",
        "description": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It uses algorithms to analyze data, identify patterns, and make predictions or decisions based on historical information.",
        "context": "The transcript discusses various machine learning algorithms including neural networks, decision trees, and support vector machines. It covers applications in image recognition, natural language processing, and predictive analytics."
    }},
    {{
        "concepts": "Data Science",
        "description": "Data science is an interdisciplinary field that combines statistics, programming, and domain expertise to extract insights from large datasets. It involves data collection, cleaning, analysis, and visualization to support decision-making processes.",
        "context": "The discussion focuses on data science workflows, including data preprocessing techniques, exploratory data analysis methods, and the importance of feature engineering in building effective models."
    }}
]

Transcript:
{transcript}
"""

    try:
        logger.debug(f"Calling Together API with model={model}")

        # API Call
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
        )

        # Clean Extraction
        try:
            content = response.choices[0].message.content
            if not content:
                raise ValueError("API returned empty content")
        except (AttributeError, IndexError) as e:
            logger.error(f"Malformed API response: {response}")
            raise ValueError(f"API response error: {e}")

        # Robust JSON Extraction (Regex)
        # Finds the first '[' and the last ']' to ignore markdown or chatty intros
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(0)
        else:
            # Fallback: try parsing the whole string if regex failed
            json_str = content

        try:
            items = json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"JSON Decode failed. Raw content: {content[:1000]}")
            raise

        # Validation
        if not isinstance(items, list):
            logger.warning("Model returned a single item not wrapped in a list. Wrapping now.")
            items = [items]

        # Validate and filter items
        validated_items = []
        for item in items:
            if isinstance(item, dict):
                # Ensure all required fields are present and are strings
                validated_item = {
                    "concepts": str(item.get("concepts", "")).strip(),
                    "description": str(item.get("description", "")).strip(),
                    "context": str(item.get("context", "")).strip()
                }
                # Only add if concepts and description are not empty
                if validated_item["concepts"] and validated_item["description"]:
                    validated_items.append(validated_item)
                else:
                    logger.warning(f"Skipping item with missing required fields: {item}")
            else:
                logger.warning(f"Skipping non-dict item: {item}")
        
        logger.info(f"Successfully extracted {len(validated_items)} items")
        return validated_items

    except Exception as e:
        logger.error(f"Error in transcript_to_item_descriptions: {str(e)}", exc_info=True)
        raise e

