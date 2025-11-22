from fastapi import APIRouter

router = APIRouter()


@router.get("/quiz")
def get_quiz():
    """
    Quiz-related endpoints.
    """
    return {"message": "Quiz endpoint - to be implemented"}

