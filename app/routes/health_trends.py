from fastapi import APIRouter
from app.database import database
from app.schemas.health_trend import HealthTrendCreate

router = APIRouter()

@router.post("/health_trends")
async def create_trend(trend: HealthTrendCreate):
    result = await database.health_trends.insert_one(trend.dict())
    return {"id": str(result.inserted_id)}


@router.get("/health_trends")
async def get_trends():
    trends = []
    async for trend in database.health_trends.find():
        trend["_id"] = str(trend["_id"])
        trends.append(trend)
    return trends