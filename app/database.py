from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI not found in environment variables")

client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
database = client["eldersafe"]

__all__ = ["client", "database"]