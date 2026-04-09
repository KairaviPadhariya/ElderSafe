import asyncio
from app.database import database

async def main():
    res_jay = await database.users.delete_many({"email": "jay@gmail.com"})
    res_aditi = await database.users.delete_many({"email": "aditi@gmail.com"})
    print(f"Deleted {res_jay.deleted_count} records for jay@gmail.com")
    print(f"Deleted {res_aditi.deleted_count} records for aditi@gmail.com")

asyncio.run(main())
