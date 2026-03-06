from fastapi import FastAPI
from app.database import database, client
from app.routes import users

app = FastAPI()

app.include_router(users.router) 

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