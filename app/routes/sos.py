from fastapi import APIRouter,  Depends
from app.database import database
from app.schemas.sos import SOSCreate
from datetime import datetime
from app.utils.auth import verify_token

router = APIRouter()

@router.post("/sos")
async def create_sos(
    sos: SOSCreate,
    current_user: str = Depends(verify_token)
):
    sos_dict = sos.dict()
    sos_dict["created_by"] = current_user
    sos_dict["created_at"] = datetime.utcnow()
    result = await database.sos.insert_one(sos_dict)
    return {"sos_id": str(result.inserted_id)}

@router.get("/sos")
async def get_sos(current_user: str = Depends(verify_token)):
    alerts = []
    async for alert in database.sos.find():
        alert["_id"] = str(alert["_id"])
        alerts.append(alert)
    return alerts