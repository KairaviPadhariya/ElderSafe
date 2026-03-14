from fastapi import APIRouter, Depends
from app.utils.auth import verify_token
from app.database import database
from app.schemas.appointment import AppointmentCreate
from datetime import datetime

router = APIRouter()

@router.post("/appointments")
async def create_appointment(appointment: AppointmentCreate):
    appointment_dict = appointment.dict()
    appointment_dict["created_at"] = datetime.utcnow()
    result = await database.appointments.insert_one(appointment_dict)
    return {"id": str(result.inserted_id)}


@router.get("/appointments")
async def get_appointments(current_user: str = Depends(verify_token)):
    appointments = []
    async for appointment in database.appointments.find():
        appointment["_id"] = str(appointment["_id"])
        appointments.append(appointment)
    return appointments