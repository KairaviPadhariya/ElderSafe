from fastapi import APIRouter
from app.database import database
from app.schemas.daily_health_log import DailyHealthLogCreate

router = APIRouter()

@router.post("/daily_health_logs")
async def create_health_log(log: DailyHealthLogCreate):

    result = await database.daily_health_logs.insert_one(log.dict())

    return {"id": str(result.inserted_id)}


@router.get("/daily_health_logs")
async def get_health_logs():

    logs = []

    async for log in database.daily_health_logs.find():
        log["_id"] = str(log["_id"])
        logs.append(log)

    return logs