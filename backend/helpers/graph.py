import httpx
import logging
import json
import uuid
from typing import Dict, Any, List, Optional, TYPE_CHECKING
from concurrent.futures import ThreadPoolExecutor, as_completed

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
) -> List[Dict[str, Any]]:
    """
    Extract a list of key themes from a transcript as JSON objects suitable for semantic search with Wikidata.
    
    Args:
        transcript: The transcript text string
        client: Together API client instance
        model: The model to use for completion (default: meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo)
        temperature: Sampling temperature (default: 0.7)
        max_transcript_chars: Maximum characters from transcript to send (default: 20000)
    
    Returns:
        List of ConceptTree dictionaries, where each dictionary contains:
        - id: unique identifier string
        - name: the concept name (from concepts field)
        - type: 'concept'
        - data: ConceptData with concepts, description, and optional context
        - children: optional list of ConceptTree for sub-concepts
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
   - "description": A general description (approx. 50 words) about the concept itself - this should be pure conceptual knowledge, not containing any information about the video or transcript
   - "context": A longer, detailed description (approx. 100-150 words) that is specific to how this concept appears in the video transcript, including relevant details, examples, and information from the transcript that could guide further generation of subtopics
3. Output MUST be a valid JSON Array of objects.

Example Output Format:
[
    {{
        "concepts": "Machine Learning",
        "description": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It uses algorithms to analyze data, identify patterns, and make predictions or decisions based on historical information.",
        "context": "The transcript discusses various machine learning algorithms including neural networks, decision trees, and support vector machines. It covers applications in image recognition, natural language processing, and predictive analytics. The speaker explains how neural networks are particularly effective for complex pattern recognition tasks, while decision trees offer interpretability for business applications. Specific examples from the video include using machine learning for fraud detection in financial systems and recommendation engines in e-commerce platforms."
    }},
    {{
        "concepts": "Data Science",
        "description": "Data science is an interdisciplinary field that combines statistics, programming, and domain expertise to extract insights from large datasets. It involves data collection, cleaning, analysis, and visualization to support decision-making processes.",
        "context": "The discussion focuses on data science workflows, including data preprocessing techniques, exploratory data analysis methods, and the importance of feature engineering in building effective models. The transcript emphasizes the iterative nature of data science projects, highlighting how data quality issues discovered during preprocessing can significantly impact model performance. The speaker provides detailed examples of handling missing values, outlier detection, and feature scaling techniques used in their recent project."
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
        
        # Helper function to decompose each item into sub-concepts
        def decompose_item_description(
            concepts: str,
            description: str,
            context: str,
        ) -> List[Dict[str, str]]:
            """
            Decompose a parent concept into sub-concepts using an LLM.
            
            Args:
                concepts: The parent concept name (1-3 words)
                description: The parent concept description (~50 words)
                context: Context information about how the concept appears in the transcript
            
            Returns:
                List of dictionaries, where each dictionary contains:
                - concepts: 1-3 words describing the sub-concept
                - description: ~50 words describing the sub-concept
            """
            prompt = f"""Given a parent concept, decompose it into meaningful sub-concepts that are more specific and detailed.

Parent Concept Information:
- Concepts: {concepts}
- Description: {description}
- Context: {context}

Requirements:
1. Identify 3-7 distinct sub-concepts that are components, aspects, or specialized areas within the parent concept.
2. Each sub-concept should be more specific than the parent but still substantial enough to be meaningful.
3. For each sub-concept, create a JSON object with:
   - "concepts": A concise 1-3 word phrase identifying the sub-concept
   - "description": A general description (approx. 50 words) about the sub-concept itself - this should be pure conceptual knowledge
4. Output MUST be a valid JSON Array of objects.

Example Output Format:
[
    {{
        "concepts": "Neural Networks",
        "description": "Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) organized in layers that process information through weighted connections and activation functions."
    }},
    {{
        "concepts": "Decision Trees",
        "description": "Decision trees are tree-like models used for classification and regression. They make decisions by splitting data based on feature values, creating a flowchart-like structure that is easy to interpret."
    }}
]

Generate sub-concepts for the parent concept above:
"""

            try:
                logger.debug(f"Calling Together API to decompose concept '{concepts}' with model={model}")

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
                    sub_items = json.loads(json_str)
                except json.JSONDecodeError as e:
                    logger.error(f"JSON Decode failed. Raw content: {content[:1000]}")
                    raise

                # Validation
                if not isinstance(sub_items, list):
                    logger.warning("Model returned a single item not wrapped in a list. Wrapping now.")
                    sub_items = [sub_items]

                # Validate and filter items
                validated_sub_items = []
                for sub_item in sub_items:
                    if isinstance(sub_item, dict):
                        # Ensure all required fields are present and are strings
                        validated_sub_item = {
                            "concepts": str(sub_item.get("concepts", "")).strip(),
                            "description": str(sub_item.get("description", "")).strip()
                        }
                        # Only add if concepts and description are not empty
                        if validated_sub_item["concepts"] and validated_sub_item["description"]:
                            validated_sub_items.append(validated_sub_item)
                        else:
                            logger.warning(f"Skipping sub-item with missing required fields: {sub_item}")
                    else:
                        logger.warning(f"Skipping non-dict sub-item: {sub_item}")
                
                logger.info(f"Successfully decomposed '{concepts}' into {len(validated_sub_items)} sub-concepts")
                return validated_sub_items

            except Exception as e:
                logger.error(f"Error decomposing item '{concepts}': {str(e)}", exc_info=True)
                # Return empty list on error to not break the main flow
                return []
        
        # Decompose each item into sub-concepts asynchronously
        def decompose_with_error_handling(item):
            """Wrapper to handle errors during decomposition"""
            try:
                sub_concepts = decompose_item_description(
                    concepts=item["concepts"],
                    description=item["description"],
                    context=item["context"]
                )
                return item, sub_concepts
            except Exception as e:
                logger.warning(f"Failed to decompose item '{item.get('concepts', 'unknown')}': {str(e)}")
                return item, []
        
        # Use ThreadPoolExecutor to run decompositions in parallel
        with ThreadPoolExecutor(max_workers=min(len(validated_items), 10)) as executor:
            # Submit all decomposition tasks
            future_to_item = {
                executor.submit(decompose_with_error_handling, item): item 
                for item in validated_items
            }
            
            # Process results as they complete
            for future in as_completed(future_to_item):
                item, sub_concepts = future.result()
                item["sub_concepts"] = sub_concepts
        
        # Transform to ConceptTree format
        def transform_to_concept_tree(item: Dict[str, Any]) -> Dict[str, Any]:
            """Transform an item with sub_concepts to ConceptTree format"""
            concept_id = str(uuid.uuid4())
            
            # Build data object
            data: Dict[str, Any] = {
                "concepts": item["concepts"],
                "description": item["description"]
            }
            # Add context if it exists and is not empty
            if item.get("context", "").strip():
                data["context"] = item["context"]
            
            # Build children from sub_concepts
            children = None
            if item.get("sub_concepts"):
                children = [
                    {
                        "id": str(uuid.uuid4()),
                        "name": sub_item["concepts"],
                        "type": "concept",
                        "data": {
                            "concepts": sub_item["concepts"],
                            "description": sub_item["description"]
                        }
                    }
                    for sub_item in item["sub_concepts"]
                ]
            
            return {
                "id": concept_id,
                "name": item["concepts"],
                "type": "concept",
                "data": data,
                **({"children": children} if children else {})
            }
        
        # Transform all items to ConceptTree format
        concept_trees = [transform_to_concept_tree(item) for item in validated_items]
        
        # Helper function to extract YouTube video ID from URL
        def extract_youtube_video_id(url: str) -> Optional[str]:
            """Extract YouTube video ID from various URL formats"""
            import re
            from urllib.parse import urlparse, parse_qs
            
            # Pattern for youtu.be URLs
            youtu_be_match = re.search(r'youtu\.be/([A-Za-z0-9_-]{11})', url)
            if youtu_be_match:
                return youtu_be_match.group(1)
            
            # Pattern for youtube.com URLs
            try:
                parsed = urlparse(url)
                if 'youtube.com' in parsed.netloc:
                    # Check query parameters
                    query_params = parse_qs(parsed.query)
                    if 'v' in query_params:
                        return query_params['v'][0]
                    # Check path for embed URLs
                    embed_match = re.search(r'/embed/([A-Za-z0-9_-]{11})', parsed.path)
                    if embed_match:
                        return embed_match.group(1)
            except Exception:
                pass
            
            # Fallback: try to find any 11-character video ID pattern
            video_id_match = re.search(r'[A-Za-z0-9_-]{11}', url)
            if video_id_match:
                return video_id_match.group(0)
            
            return None
        
        # Gather videos for each concept
        def gather_videos_for_concept(concept_tree: Dict[str, Any]) -> Dict[str, Any]:
            """Gather YouTube videos for a concept and add them as children"""
            try:
                concept_name = concept_tree.get("name", "")
                if not concept_name:
                    return concept_tree
                
                logger.debug(f"Gathering videos for concept: {concept_name}")
                video_results = gather_links(concept_name, max_results=3)
                
                # Transform video results to ConceptTree format
                video_children = []
                for video in video_results.get("videos", []):
                    video_url = video.get("link", "")
                    video_id = extract_youtube_video_id(video_url)
                    
                    if video_id:
                        video_children.append({
                            "id": str(uuid.uuid4()),
                            "name": video.get("title", "Untitled Video"),
                            "type": "video",
                            "data": {
                                "video_id": video_id
                            }
                        })
                
                # Add video children to existing children or create new children list
                if video_children:
                    if "children" in concept_tree and concept_tree["children"]:
                        concept_tree["children"].extend(video_children)
                    else:
                        concept_tree["children"] = video_children
                    logger.info(f"Added {len(video_children)} videos to concept '{concept_name}'")
                
                return concept_tree
            except Exception as e:
                logger.warning(f"Error gathering videos for concept '{concept_tree.get('name', 'unknown')}': {str(e)}")
                return concept_tree
        
        # Gather videos for all concepts in parallel
        with ThreadPoolExecutor(max_workers=min(len(concept_trees), 10)) as executor:
            # Submit all video gathering tasks with index tracking
            future_to_index = {
                executor.submit(gather_videos_for_concept, tree): idx 
                for idx, tree in enumerate(concept_trees)
            }
            
            # Process results and maintain order
            updated_trees = [None] * len(concept_trees)
            for future in as_completed(future_to_index):
                idx = future_to_index[future]
                updated_tree = future.result()
                updated_trees[idx] = updated_tree
        
        # All futures should complete successfully (errors are handled in gather_videos_for_concept)
        concept_trees = updated_trees
        
        return concept_trees

    except Exception as e:
        logger.error(f"Error in transcript_to_item_descriptions: {str(e)}", exc_info=True)
        raise e


def gather_links(topic: str, max_results: int = 10) -> Dict[str, List[Dict[str, str]]]:
    """
    Search DuckDuckGo for YouTube videos related to a topic.
    
    Args:
        topic: The search topic/keywords
        max_results: Maximum number of results to return (default: 10)
    
    Returns:
        Dictionary with one key:
        - "videos": List of dictionaries with "title" and "link" keys (YouTube videos only)
    """
    from duckduckgo_search import DDGS
    
    logger.debug(f"🔍 Searching DuckDuckGo for YouTube videos: {topic}...")
    
    results = {
        "videos": []
    }
    
    try:
        with DDGS() as ddgs:
            # Get Video Links and filter for YouTube only
            video_gen = ddgs.videos(
                keywords=topic,
                max_results=max_results * 2,  # Get more results to account for filtering
                safesearch='moderate',
                region="wt-wt"  # "wt-wt" means global/no region
            )
            
            for r in video_gen:
                title = r.get("title", "")
                link = r.get("content", "")  # In DDGS, video URL is often in 'content'
                
                # Filter for YouTube videos only
                if title and link and ("youtube.com" in link.lower() or "youtu.be" in link.lower()):
                    results["videos"].append({
                        "title": title,
                        "link": link
                    })
                    
                    # Stop once we have enough YouTube videos
                    if len(results["videos"]) >= max_results:
                        break
        
        logger.info(f"Found {len(results['videos'])} YouTube videos for topic: {topic}")
        return results
        
    except Exception as e:
        logger.error(f"Error searching DuckDuckGo for topic '{topic}': {str(e)}", exc_info=True)
        # Return empty results on error rather than raising
        return results


