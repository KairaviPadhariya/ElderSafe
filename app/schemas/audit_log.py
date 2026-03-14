from pydantic import BaseModel

class AuditLogCreate(BaseModel):
    user_id: str
    action: str
    timestamp: str