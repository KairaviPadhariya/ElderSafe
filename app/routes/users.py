from fastapi import APIRouter, HTTPException
from app.database import database
from app.schemas.user import UserCreate
from datetime import datetime
from passlib.context import CryptContext
from app.schemas.login import LoginRequest
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token
from bson import ObjectId

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


# ---------------- CREATE USER ----------------
@router.post("/users")
async def create_user(user: UserCreate):

    user_dict = user.dict()

    # hash password
    user_dict["password"] = hash_password(user.password)

    user_dict["created_at"] = datetime.utcnow()

    result = await database.users.insert_one(user_dict)

    return {"id": str(result.inserted_id)}


# ---------------- GET ALL USERS ----------------
@router.get("/users")
async def get_users():
    users = []

    async for user in database.users.find():
        user["_id"] = str(user["_id"])
        users.append(user)

    return users


# ---------------- GET SINGLE USER ----------------
@router.get("/users/{user_id}")
async def get_user(user_id: str):

    try:
        user = await database.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["_id"] = str(user["_id"])
    return user


# ---------------- UPDATE USER ----------------
@router.put("/users/{user_id}")
async def update_user(user_id: str, user: UserCreate):

    user_dict = user.dict()
    user_dict["password"] = hash_password(user.password)

    result = await database.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": user_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User updated"}


# ---------------- DELETE USER ----------------
@router.delete("/users/{user_id}")
async def delete_user(user_id: str):

    result = await database.users.delete_one({"_id": ObjectId(user_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted"}


# ---------------- LOGIN ----------------
@router.post("/login")
async def login(user: LoginRequest):

    db_user = await database.users.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed_password = db_user.get("password")

    if not hashed_password:
        raise HTTPException(status_code=500, detail="Password missing in database")

    if not verify_password(user.password, hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token({"user_id": str(db_user["_id"])})

    return {
        "access_token": token,
        "token_type": "bearer"
    }