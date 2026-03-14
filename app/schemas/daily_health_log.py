from pydantic import BaseModel

class DailyHealthLogCreate(BaseModel):
    patient_id: str
    blood_pressure: str
    heart_rate: int
    notes: str