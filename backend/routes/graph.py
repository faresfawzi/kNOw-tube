from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from helpers.graph import identify_concept, search_concepts

router = APIRouter()


@router.get("/graph/identify")
def identify_concept_endpoint(
    concept_name: str = Query(..., description="The text name of the concept to identify (e.g., 'Python (programming language)')"),
    language: str = Query("en", description="Language code for the label (default: 'en')")
):
    """
    Identify a concept in the formal Wikidata structure using its text name.
    example: http://localhost:5173/api/graph/identify?concept_name=Python%20(programming%20language)
    
    Args:
        concept_name: The text name of the concept to identify
        language: Language code for the label (default: "en")
    
    Returns:
        Dictionary containing Wikidata entity information including QID, label, description, and URI.
    """
    result = identify_concept(concept_name, language)
    
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Concept '{concept_name}' not found in Wikidata."
        )
    
    return {
        "concept_name": concept_name,
        "result": result
    }


@router.get("/graph/search")
def search_concepts_endpoint(
    concept_name: str = Query(..., description="The text name to search for (e.g., 'Python')"),
    language: str = Query("en", description="Language code for the label (default: 'en')"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results to return (1-50, default: 10)")
):
    """
    Search for multiple concepts matching a text name in Wikidata.
    example: http://localhost:5173/api/graph/search?concept_name=Python&limit=5
    
    Args:
        concept_name: The text name to search for
        language: Language code for the label (default: "en")
        limit: Maximum number of results to return (1-50, default: 10)
    
    Returns:
        List of dictionaries containing Wikidata entity information for matching concepts.
    """
    results = search_concepts(concept_name, language, limit)
    
    return {
        "search_term": concept_name,
        "count": len(results),
        "results": results
    }


@router.get("/graph")
def get_graph():
    """
    Graph-related endpoints info.
    """
    return {
        "message": "Graph endpoints available",
        "endpoints": {
            "/graph/identify": "Identify a single concept by exact name",
            "/graph/search": "Search for multiple concepts by partial name match"
        }
    }

