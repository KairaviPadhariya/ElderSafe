from pydantic import BaseModel
from typing import Optional

class FamilyCreate(BaseModel):
    name: str
    email: str
    patient_id: Optional[str] = None
    patient_name: str
    relation: str
    access_level: str
    phone: Optional[str] = None
    address: Optional[str] = None
