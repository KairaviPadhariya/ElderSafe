from pydantic import BaseModel

class DoctorCreate(BaseModel):
    name: str
    specialization: str
    phone: str
    email: str