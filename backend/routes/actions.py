from fastapi import APIRouter, HTTPException, responses
from pydantic import BaseModel
from pathlib import Path

class ActionInput(BaseModel):
    id: int
    text: str

router = APIRouter()
@router.get("/action/{item_id}")
def read_file(item_id: int) -> str:
    file_path = Path("actions") / f"{item_id}.txt"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        return responses.PlainTextResponse(file_path.read_text(encoding="utf-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/action")
def write_file(payload: ActionInput):
    print(f"Received payload: {payload}")
    file_path = Path("actions") / f"{payload.id}.txt"

    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(payload.text, encoding="utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "ok", "id": payload.id}