from typing import Optional

from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    title: Optional[str] = None
    message: str
    status: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
