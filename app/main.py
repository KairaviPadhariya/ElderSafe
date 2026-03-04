from fastapi import FastAPI, HTTPException
from app.database import database
from app.auth import hash_password, verify_password, create_access_token
from pydantic import BaseModel, EmailStr

app = FastAPI()

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


@app.post("/register")
async def register(user: UserRegister):
    existing_user = await database.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)

    await database.users.insert_one({
        "email": user.email,
        "password": hashed
    })

    return {"message": "User registered successfully"}


@app.post("/login")
async def login(user: UserLogin):
    db_user = await database.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }