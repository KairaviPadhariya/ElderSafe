from fastapi import APIRouter
from app.database import database
from app.schemas.medical_history import MedicalHistoryCreate

router = APIRouter()

@router.post("/medical_history")
async def create_history(history: MedicalHistoryCreate):
    result = await database.medical_history.insert_one(history.dict())
    return {"id": str(result.inserted_id)}


@router.get("/medical_history")
async def get_history():
    history_list = []
    async for history in database.medical_history.find():
        history["_id"] = str(history["_id"])
        history_list.append(history)
    return history_list