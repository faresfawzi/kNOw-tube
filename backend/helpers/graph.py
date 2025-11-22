import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php"
# User-Agent required by Wikidata API policy
USER_AGENT = "kNOw-tube/1.0 (https://github.com/yourusername/kNOw-tube; contact@example.com) Python/httpx"


def identify_concept(concept_name: str, language: str = "en") -> Optional[Dict[str, Any]]:
    """
    Identify a concept in the formal Wikidata structure using its text name.
    Uses Wikidata's wbsearchentities API for simpler text-based search.
    
    Args:
        concept_name: The text name of the concept to identify
        language: Language code for the label (default: "en")
    
    Returns:
        Dictionary containing Wikidata entity information including:
        - qid: The Wikidata QID (e.g., "Q28865")
        - label: The entity label
        - description: The entity description
        - uri: The Wikidata URI
        - full_entity: Full entity data from Wikidata
        Returns None if concept not found
    """
    try:
        params = {
            "action": "wbsearchentities",
            "search": concept_name,
            "language": language,
            "format": "json",
            "limit": 1
        }
        
        logger.debug(f"Searching Wikidata for concept: '{concept_name}' (language: {language})")
        
        headers = {
            "User-Agent": USER_AGENT
        }
        
        with httpx.Client() as client:
            response = client.get(WIKIDATA_API_URL, params=params, headers=headers)
            logger.debug(f"Wikidata API response status: {response.status_code}")
            response.raise_for_status()
            data = response.json()
        
        logger.debug(f"Wikidata API response data keys: {data.keys() if data else 'None'}")
        
        if "search" in data:
            logger.debug(f"Found {len(data['search'])} results in search")
            if len(data["search"]) > 0:
                entity = data["search"][0]
                logger.info(f"Successfully identified concept '{concept_name}' as QID: {entity.get('id')}")
                
                return {
                    "qid": entity.get("id"),
                    "label": entity.get("label"),
                    "description": entity.get("description", ""),
                    "uri": f"http://www.wikidata.org/entity/{entity.get('id')}",
                    "full_entity": entity
                }
            else:
                logger.warning(f"No results found for concept: '{concept_name}'")
        else:
            logger.warning(f"Unexpected response structure from Wikidata API. Keys: {data.keys() if data else 'None'}")
        
        return None
    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP error while searching Wikidata for '{concept_name}': "
            f"Status {e.response.status_code}, Response: {e.response.text[:200]}"
        )
        return None
    except httpx.RequestError as e:
        logger.error(
            f"Request error while searching Wikidata for '{concept_name}': {str(e)}"
        )
        return None
    except Exception as e:
        logger.error(
            f"Unexpected error while searching Wikidata for '{concept_name}': {type(e).__name__}: {str(e)}",
            exc_info=True
        )
        return None


def search_concepts(concept_name: str, language: str = "en", limit: int = 10) -> list[Dict[str, Any]]:
    """
    Search for multiple concepts matching a text name in Wikidata.
    Uses Wikidata's wbsearchentities API which automatically handles partial matching.
    
    Args:
        concept_name: The text name to search for
        language: Language code for the label (default: "en")
        limit: Maximum number of results to return (default: 10, max: 50)
    
    Returns:
        List of dictionaries containing Wikidata entity information
    """
    try:
        # Limit to max 50 as per Wikidata API limits
        limit = min(limit, 50)
        
        params = {
            "action": "wbsearchentities",
            "search": concept_name,
            "language": language,
            "format": "json",
            "limit": limit
        }
        
        logger.debug(f"Searching Wikidata for concepts matching: '{concept_name}' (language: {language}, limit: {limit})")
        
        headers = {
            "User-Agent": USER_AGENT
        }
        
        with httpx.Client() as client:
            response = client.get(WIKIDATA_API_URL, params=params, headers=headers)
            logger.debug(f"Wikidata API response status: {response.status_code}")
            response.raise_for_status()
            data = response.json()
        
        entities = []
        if "search" in data:
            logger.debug(f"Found {len(data['search'])} results in search")
            for entity in data["search"]:
                entities.append({
                    "qid": entity.get("id"),
                    "label": entity.get("label"),
                    "description": entity.get("description", ""),
                    "uri": f"http://www.wikidata.org/entity/{entity.get('id')}",
                    "full_entity": entity
                })
            logger.info(f"Successfully found {len(entities)} concepts matching '{concept_name}'")
        else:
            logger.warning(f"Unexpected response structure from Wikidata API. Keys: {data.keys() if data else 'None'}")
        
        return entities
    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP error while searching Wikidata for '{concept_name}': "
            f"Status {e.response.status_code}, Response: {e.response.text[:200]}"
        )
        return []
    except httpx.RequestError as e:
        logger.error(
            f"Request error while searching Wikidata for '{concept_name}': {str(e)}"
        )
        return []
    except Exception as e:
        logger.error(
            f"Unexpected error while searching Wikidata for '{concept_name}': {type(e).__name__}: {str(e)}",
            exc_info=True
        )
        return []

