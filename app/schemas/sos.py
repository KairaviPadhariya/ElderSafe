from typing import Optional

from pydantic import BaseModel


class SOSCreate(BaseModel):
    location: Optional[str] = None
    status: str = "active"
