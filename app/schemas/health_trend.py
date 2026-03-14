from pydantic import BaseModel

class HealthTrendCreate(BaseModel):
    patient_id: str
    metric: str
    value: float
    date: str