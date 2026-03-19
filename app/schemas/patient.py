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
    o2_saturation: int
    heart_rate: int
    sbp: int
    dbp: int
    fbs: Optional[float] = None
    ppbs: Optional[float] = None
    cholesterol: Optional[float] = None
    phone: Optional[str] = None
    address: Optional[str] = None
