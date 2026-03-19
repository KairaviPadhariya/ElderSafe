from fastapi import APIRouter, Depends
from app.utils.auth import verify_token
from app.database import database
from app.schemas.appointment import AppointmentCreate
from datetime import datetime

router = APIRouter()

# ✅ CREATE appointment
@router.post("/appointments")
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: dict = Depends(verify_token)
):
    appointment_dict = appointment.dict()

    # ✅ FIX: use "sub"
    appointment_dict["user_id"] = current_user["sub"]

    appointment_dict["created_at"] = datetime.utcnow()

    result = await database.appointments.insert_one(appointment_dict)

    appointment_dict["_id"] = str(result.inserted_id)
    return appointment_dict


# ✅ GET appointments of logged-in user
@router.get("/appointments")
async def get_appointments(
    current_user: dict = Depends(verify_token)
):
    appointments = []

    async for appointment in database.appointments.find({
        "user_id": current_user["sub"]
    }):
        appointment["_id"] = str(appointment["_id"])
        appointments.append(appointment)

    return appointments