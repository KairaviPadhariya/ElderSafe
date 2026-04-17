from pydantic import BaseModel


class HealthTrendCreate(BaseModel):
    patient_id: str
    prediction: str
    confidence: float
    date: str
    log_date: str | None = None
