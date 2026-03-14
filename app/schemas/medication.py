from pydantic import BaseModel

class MedicationCreate(BaseModel):
    patient_id: str
    medicine_name: str
    dosage: str
    frequency: str