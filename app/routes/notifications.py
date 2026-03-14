from fastapi import APIRouter, Depends
from app.utils.auth import verify_token
from app.database import database
from app.schemas.notification import NotificationCreate

router = APIRouter()

@router.post("/notifications")
async def create_notification(notification: NotificationCreate):
    result = await database.notifications.insert_one(notification.dict())
    return {"id": str(result.inserted_id)}


@router.get("/notifications")
async def get_notifications(current_user: str = Depends(verify_token)):
    notifications = []
    async for notification in database.notifications.find():
        notification["_id"] = str(notification["_id"])
        notifications.append(notification)
    return notifications