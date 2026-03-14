from pydantic import BaseModel

class CaregiverAccessCreate(BaseModel):
    caregiver_id: str
    patient_id: str
    access_level: str