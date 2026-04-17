from typing import Optional

from pydantic import BaseModel


class AppointmentCreate(BaseModel):
    patient_id: Optional[str] = None
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    date: str
    time: str
    reason: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = "upcoming"
    doctor_note: Optional[str] = None


class AppointmentUpdate(BaseModel):
    patient_id: Optional[str] = None
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    reason: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    doctor_note: Optional[str] = None
