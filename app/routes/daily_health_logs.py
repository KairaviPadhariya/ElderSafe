from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import database
from app.schemas.daily_health_log import DailyHealthLogCreate
from app.utils.auth import verify_token

router = APIRouter()


def serialize_health_log(log: dict):
    log["_id"] = str(log["_id"])

    for field in ("created_at", "updated_at"):
        if isinstance(log.get(field), datetime):
            log[field] = log[field].isoformat()

    return log


@router.post("/daily_health_logs")
async def create_health_log(
    log: DailyHealthLogCreate,
    current_user: dict = Depends(verify_token)
):
    log_dict = log.dict(exclude_none=True)
    patient_id = current_user["sub"]
    now = datetime.utcnow()

    update_fields = {
        **log_dict,
        "patient_id": patient_id,
        "updated_at": now
    }

    try:
        await database.daily_health_logs.update_one(
            {
                "patient_id": patient_id,
                "log_date": log.log_date
            },
            {
                "$set": update_fields,
                "$setOnInsert": {
                    "created_at": now
                }
            },
            upsert=True
        )
        saved_log = await database.daily_health_logs.find_one(
            {
                "patient_id": patient_id,
                "log_date": log.log_date
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save daily health log: {exc}")

    if not saved_log:
        raise HTTPException(status_code=500, detail="Saved daily health log could not be loaded")

    return serialize_health_log(saved_log)


@router.get("/daily_health_logs")
async def get_health_logs(
    log_date: str | None = Query(default=None),
    current_user: dict = Depends(verify_token)
):
    patient_id = current_user["sub"]
    query = {"patient_id": patient_id}

    if log_date:
        query["log_date"] = log_date

    logs = []

    try:
        async for log in database.daily_health_logs.find(query).sort("log_date", -1):
            logs.append(serialize_health_log(log))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load daily health logs: {exc}")

    return logs
