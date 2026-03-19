from pydantic import BaseModel
from typing import Optional

class DoctorCreate(BaseModel):
    name: str
    specialization: str
    email: str
    phone: str
    hospital: str
    license_no: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
