from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import database
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.utils.auth import verify_token

router = APIRouter()


def build_user_appointment_query(user_id: str):
    return {
        "$or": [
            {"created_by": user_id},
            {"patient_id": user_id}
        ]
    }


def serialize_appointment(appointment: dict):
    appointment["_id"] = str(appointment["_id"])

    for field in ("created_at", "updated_at"):
        if isinstance(appointment.get(field), datetime):
            appointment[field] = appointment[field].isoformat()

    return appointment


@router.post("/appointments")
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: dict = Depends(verify_token)
):
    appointment_dict = appointment.dict(exclude_none=True)
    creator_id = current_user["sub"]

    appointment_dict["created_by"] = creator_id
    appointment_dict["creator_role"] = current_user.get("role")
    appointment_dict["patient_id"] = appointment_dict.get("patient_id") or creator_id
    appointment_dict["created_at"] = datetime.utcnow()

    try:
        result = await database.appointments.insert_one(appointment_dict)
        saved_appointment = await database.appointments.find_one({"_id": result.inserted_id})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save appointment: {exc}")

    if not saved_appointment:
        raise HTTPException(status_code=500, detail="Appointment was not found after saving")

    return serialize_appointment(saved_appointment)


@router.get("/appointments")
async def get_appointments(
    current_user: dict = Depends(verify_token)
):
    appointments = []
    query = build_user_appointment_query(current_user["sub"])

    try:
        async for appointment in database.appointments.find(query).sort("date", 1):
            appointments.append(serialize_appointment(appointment))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load appointments: {exc}")

    return appointments


@router.put("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    appointment: AppointmentUpdate,
    current_user: dict = Depends(verify_token)
):
    try:
        object_id = ObjectId(appointment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")

    query = {"_id": object_id, **build_user_appointment_query(current_user["sub"])}
    existing_appointment = await database.appointments.find_one(query)

    if not existing_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = appointment.dict(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No appointment updates provided")

    update_data["updated_at"] = datetime.utcnow()

    try:
        await database.appointments.update_one(
            {"_id": object_id},
            {"$set": update_data}
        )
        updated_appointment = await database.appointments.find_one({"_id": object_id})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update appointment: {exc}")

    if not updated_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found after update")

    return serialize_appointment(updated_appointment)


@router.delete("/appointments/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        object_id = ObjectId(appointment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")

    query = {"_id": object_id, **build_user_appointment_query(current_user["sub"])}
    existing_appointment = await database.appointments.find_one(query)

    if not existing_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    try:
        result = await database.appointments.delete_one({"_id": object_id})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete appointment: {exc}")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"message": "Appointment deleted successfully"}
