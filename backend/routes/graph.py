from fastapi import APIRouter

router = APIRouter()


@router.get("/graph")
def get_graph():
    """
    Graph-related endpoints.
    """
    return {"message": "Graph endpoint - to be implemented"}

