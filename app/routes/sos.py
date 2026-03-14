from fastapi import APIRouter
from app.database import database
from app.schemas.sos import SOSCreate
from datetime import datetime

router = APIRouter()

@router.post("/sos")
async def create_sos(sos: SOSCreate):
    sos_dict = sos.dict()
    sos_dict["created_at"] = datetime.utcnow()
    result = await database.sos.insert_one(sos_dict)
    return {"id": str(result.inserted_id)}


@router.get("/sos")
async def get_sos():
    sos_list = []
    async for sos in database.sos.find():
        sos["_id"] = str(sos["_id"])
        sos_list.append(sos)
    return sos_list