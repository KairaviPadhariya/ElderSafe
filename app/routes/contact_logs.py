from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.database import database
from app.schemas.contact_log import ContactLogCreate

router = APIRouter()


def serialize_contact_log(log: dict):
    log["_id"] = str(log["_id"])

    if isinstance(log.get("created_at"), datetime):
        log["created_at"] = log["created_at"].isoformat()

    return log


@router.post("/contact_logs")
async def create_contact_log(log: ContactLogCreate):
    log_dict = {
        **log.dict(),
        "created_at": datetime.utcnow()
    }

    try:
        result = await database.contact_logs.insert_one(log_dict)
        saved_log = await database.contact_logs.find_one({"_id": result.inserted_id})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save contact log: {exc}")

    if not saved_log:
        raise HTTPException(status_code=500, detail="Saved contact log could not be loaded")

    return serialize_contact_log(saved_log)


@router.get("/contact_logs")
async def get_contact_logs():
    logs = []

    async for log in database.contact_logs.find().sort("created_at", -1):
        logs.append(serialize_contact_log(log))

    return logs
