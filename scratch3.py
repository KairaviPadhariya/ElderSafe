import asyncio
from app.database import database

async def main():
    users = await database.users.find({"email": "jay@gmail.com"}).to_list(length=10)
    for u in users:
        print(u.get("_id"), u.get("email"), u.get("password")[:15] if u.get("password") else "No password")

asyncio.run(main())
