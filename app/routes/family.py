from fastapi import APIRouter, Depends
from app.database import database
from app.schemas.family import FamilyCreate
from app.utils.auth import verify_token
from datetime import datetime

router = APIRouter()

@router.post("/family")
async def create_family(access: FamilyCreate, current_user: dict = Depends(verify_token)):
    family_dict = access.dict()
    family_dict["user_id"] = current_user["sub"]
    family_dict["updated_at"] = datetime.utcnow()

    result = await database.family.update_one(
        {"user_id": current_user["sub"]},
        {
            "$set": family_dict,
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )

    saved_family = await database.family.find_one({"user_id": current_user["sub"]})

    return {
        "id": str(saved_family["_id"]),
        "created": result.upserted_id is not None,
        "updated": result.matched_count > 0
    }


@router.get("/family/me")
async def get_my_family(current_user: dict = Depends(verify_token)):
    family = await database.family.find_one({"user_id": current_user["sub"]})

    if not family:
        return None

    family["_id"] = str(family["_id"])
    return family


@router.get("/family")
async def get_family():
    family_list = []
    async for family in database.family.find():
        family["_id"] = str(family["_id"])
        family_list.append(family)
    return family_list
