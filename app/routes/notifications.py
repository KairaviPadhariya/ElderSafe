from fastapi import APIRouter, Depends
<<<<<<< HEAD
=======
from app.utils.auth import verify_token
>>>>>>> ed18f6d4982d3b037207c70cce893526eb36eeaf
from app.database import database
from app.schemas.notification import NotificationCreate
from app.utils.auth import verify_token

router = APIRouter()

@router.post("/notifications")
async def create_notification(
    notification: NotificationCreate,
    current_user: str = Depends(verify_token)
):
    notification_dict = notification.dict()
    notification_dict["created_at"] = datetime.utcnow()
    result = await database.notifications.insert_one(notification_dict)
    return {"notification_id": str(result.inserted_id)}

<<<<<<< HEAD
router.get("/notifications")
=======

@router.get("/notifications")
>>>>>>> ed18f6d4982d3b037207c70cce893526eb36eeaf
async def get_notifications(current_user: str = Depends(verify_token)):
    notifications = []
    async for n in database.notifications.find():
        n["_id"] = str(n["_id"])
        notifications.append(n)
    return notifications
