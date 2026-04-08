from fastapi import APIRouter
from app.database import database
from app.schemas.audit_log import AuditLogCreate

router = APIRouter()

@router.post("/audit_logs")
async def create_audit_log(log: AuditLogCreate):
    result = await database.audit_logs.insert_one(log.dict())
    return {"id": str(result.inserted_id)}


@router.get("/audit_logs")
async def get_audit_logs():
    logs = []
    async for log in database.audit_logs.find():
        log["_id"] = str(log["_id"])
        logs.append(log)
    return logs