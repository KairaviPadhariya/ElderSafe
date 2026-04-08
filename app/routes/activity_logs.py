from fastapi import APIRouter
from app.database import database
from app.schemas.activity_log import ActivityLogCreate
from datetime import datetime

router = APIRouter()

@router.post("/activity_logs")
async def create_activity_log(log: ActivityLogCreate):
    log_dict = log.dict()
    log_dict["created_at"] = datetime.utcnow()
    result = await database.activity_logs.insert_one(log_dict)
    return {"id": str(result.inserted_id)}


@router.get("/activity_logs")
async def get_activity_logs():
    logs = []
    async for log in database.activity_logs.find():
        log["_id"] = str(log["_id"])
        logs.append(log)
    return logs