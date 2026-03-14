from fastapi import APIRouter
from app.database import database
from app.schemas.user import UserCreate
from datetime import datetime
from passlib.context import CryptContext

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

# Create User
@router.post("/users")
async def create_user(user: UserCreate):

    user_dict = user.dict()

    # hash password
    user_dict["password"] = hash_password(user.password)

    user_dict["created_at"] = datetime.utcnow()

    result = await database.users.insert_one(user_dict)

    return {"id": str(result.inserted_id)}

# Get all Users
@router.get("/users")
async def get_users():
    users = []
    async for user in database.users.find():
        user["_id"] = str(user["_id"])
        users.append(user)
    return users

# Get single user
@router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await database.users.find_one({"_id": user_id})
    if user:
        user["_id"] = str(user["_id"])
        return user
    return {"error": "User not found"}

# update user
@router.put("/users/{user_id}")
async def update_user(user_id: str, user: UserCreate):
    await database.users.update_one(
        {"_id": user_id},
        {"$set": user.dict()}
    )
    return {"message": "User updated"}

# delete user
@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    await database.users.delete_one({"_id": user_id})
    return {"message": "User deleted"}