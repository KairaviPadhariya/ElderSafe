from fastapi import APIRouter, Depends, HTTPException

from app.database import database
from app.schemas.activity_log import ActivityLogCreate
from datetime import datetime
from app.utils.auth import verify_token

router = APIRouter()


def serialize_activity_log(log: dict):
    log["_id"] = str(log["_id"])

    if isinstance(log.get("created_at"), datetime):
        log["created_at"] = log["created_at"].isoformat()

    return log


@router.post("/activity_logs")
async def create_activity_log(
    log: ActivityLogCreate,
    current_user: dict = Depends(verify_token)
):
    log_dict = {
        **log.dict(),
        "user_id": current_user["sub"],
        "user_role": current_user.get("role"),
        "created_at": datetime.utcnow()
    }

    try:
        result = await database.activity_logs.insert_one(log_dict)
        saved_log = await database.activity_logs.find_one({"_id": result.inserted_id})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save activity log: {exc}")

    if not saved_log:
        raise HTTPException(status_code=500, detail="Saved activity log could not be loaded")

    return serialize_activity_log(saved_log)


@router.get("/activity_logs")
async def get_activity_logs(current_user: dict = Depends(verify_token)):
    logs = []

    async for log in database.activity_logs.find({"user_id": current_user["sub"]}).sort("created_at", -1):
        logs.append(serialize_activity_log(log))

    return logs
