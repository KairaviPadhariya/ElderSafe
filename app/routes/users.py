from fastapi import APIRouter
from app.database import database
from app.schemas.user import UserCreate
from datetime import datetime

router = APIRouter()

@router.post("/users")
async def create_user(user: UserCreate):
    user_dict = user.dict()
    user_dict["created_at"] = datetime.utcnow()
    result = await database.users.insert_one(user_dict)
    return {
        "id": str(result.inserted_id)
        }
    