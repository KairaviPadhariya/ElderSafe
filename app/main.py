from fastapi import FastAPI
from app.database import database

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "Backend is running 🚀"}

@app.get("/db-test")
async def db_test():
    collections = await database.list_collection_names()
    return {"connected": True, "collections": collections}