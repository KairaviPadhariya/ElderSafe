from fastapi import FastAPI
from app.database import database, client

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "Backend is running 🚀"}

@app.get("/db-test")
async def db_test():
    try:
        collections = await database.list_collection_names()
        return {"connected": True, "collections": collections}
    except Exception as e:
        return {"connected": False, "error": str(e)}