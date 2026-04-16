from pydantic import BaseModel
from typing import Optional

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    height: float
    weight: float
    bmi: Optional[float] = None
    blood_group: str
    o2_saturation: Optional[int] = None
    heart_rate: Optional[int] = None
    sbp: Optional[int] = None
    dbp: Optional[int] = None
    has_bp: Optional[bool] = None
    has_diabetes: Optional[bool] = None
    has_cardiac_history: Optional[bool] = None
    fbs: Optional[float] = None
    ppbs: Optional[float] = None
    cholesterol: Optional[float] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
