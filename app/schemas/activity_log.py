from typing import Any

from pydantic import BaseModel, Field

class ActivityLogCreate(BaseModel):
    action: str
    description: str
    activity_type: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
