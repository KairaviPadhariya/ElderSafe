from pydantic import BaseModel

class PrescriptionCreate(BaseModel):
    patient_id: str
    doctor_id: str
    medication: str
    dosage: str