from pydantic import BaseModel

class SOSCreate(BaseModel):
    patient_id: str
    location: str
    status: str