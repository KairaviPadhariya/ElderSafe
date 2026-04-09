from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.database import database
from app.schemas.user import UserCreate
from datetime import datetime
from passlib.context import CryptContext
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token
from app.utils.auth import verify_token
from bson import ObjectId

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -------- PASSWORD HASH --------
def hash_password(password: str):
    return pwd_context.hash(password)

# ---------------- CREATE USER ----------------
@router.post("/users")
async def create_user(user: UserCreate):

    user_dict = user.dict()

    # Check if email already exists
    existing_user = await database.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # hash password
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.utcnow()

    result = await database.users.insert_one(user_dict)

    return {"id": str(result.inserted_id)}

# ---------------- GET ALL USERS ----------------
@router.get("/users")
async def get_users(current_user: dict = Depends(verify_token)):

    users = []

    async for user in database.users.find():
        user["_id"] = str(user["_id"])
        users.append(user)

    return users

# ---------------- GET SINGLE USER ----------------
@router.get("/users/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(verify_token)):

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
async def update_user(user_id: str, user: UserCreate, current_user: dict = Depends(verify_token)):

    user_dict = user.dict()

    # hash password again
    user_dict["password"] = hash_password(user.password)

    result = await database.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": user_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User updated"}

# ---------------- DELETE USER (ADMIN ONLY) ----------------
@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(verify_token)):

    # ✅ FIX: use "sub"
    try:
        logged_user = await database.users.find_one({
            "_id": ObjectId(current_user["sub"])
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid token user ID")

    if not logged_user:
        raise HTTPException(status_code=404, detail="Logged user not found")

    if logged_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete users")

    result = await database.users.delete_one({"_id": ObjectId(user_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}

# ---------------- GET CURRENT USER ----------------
@router.get("/users/me")
async def get_current_user(current_user: dict = Depends(verify_token)):

    try:
        user_id = ObjectId(current_user["sub"])   # ✅ FIX
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID in token")

    user = await database.users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role")
    }

# ---------------- LOGIN ----------------
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):

    db_user = await database.users.find_one({"email": form_data.username})

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed_password = db_user.get("password")

    if not verify_password(form_data.password, hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token({
        "sub": str(db_user["_id"]),   # ✅ STANDARD
        "role": db_user["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }
