from fastapi import APIRouter
from app.database import database
from app.schemas.caregiver_access import CaregiverAccessCreate

router = APIRouter()

@router.post("/caregiver_access")
async def create_access(access: CaregiverAccessCreate):
    result = await database.caregiver_access.insert_one(access.dict())
    return {"id": str(result.inserted_id)}


@router.get("/caregiver_access")
async def get_access():
    access_list = []
    async for access in database.caregiver_access.find():
        access["_id"] = str(access["_id"])
        access_list.append(access)
    return access_list