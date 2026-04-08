from pydantic import BaseModel

class MedicalHistoryCreate(BaseModel):
    patient_id: str
    condition: str
    diagnosis_date: str
    notes: str