from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import database
from app.schemas.daily_health_log import DailyHealthLogCreate
from app.utils.auth import verify_token

router = APIRouter()


def serialize_health_log(log: dict):
    log["_id"] = str(log["_id"])

    for field in ("created_at", "updated_at"):
        if isinstance(log.get(field), datetime):
            log[field] = log[field].isoformat()

    return log


async def resolve_patient_id(current_user: dict) -> str:
    if current_user.get("role") != "family":
        return current_user["sub"]

    family_record = await database.family.find_one({"user_id": current_user["sub"]})

    if not family_record or not family_record.get("patient_id"):
        raise HTTPException(
            status_code=400,
            detail="Complete the family profile first to link a patient."
        )

    return str(family_record["patient_id"])


async def get_doctor_profile_id(user_id: str) -> str | None:
    doctor = await database.doctors.find_one({"user_id": user_id})

    if not doctor:
        return None

    return str(doctor["_id"])


async def resolve_requested_patient_id(current_user: dict, requested_patient_id: str | None) -> str:
    role = current_user.get("role")

    if role == "doctor":
        if not requested_patient_id:
            raise HTTPException(
                status_code=400,
                detail="Select a patient before viewing health trends."
            )

        doctor_profile_id = await get_doctor_profile_id(current_user["sub"])

        if not doctor_profile_id:
            raise HTTPException(
                status_code=403,
                detail="Complete the doctor profile first to access patient health logs."
            )

        allowed_patient_ids = {requested_patient_id}
        patient_profile = None

        if ObjectId.is_valid(requested_patient_id):
            patient_profile = await database.patients.find_one({"_id": ObjectId(requested_patient_id)})

        if patient_profile and patient_profile.get("user_id"):
            allowed_patient_ids.add(str(patient_profile["user_id"]))

        appointment = await database.appointments.find_one({
            "doctor_id": doctor_profile_id,
            "patient_id": {"$in": list(allowed_patient_ids)}
        })

        if not appointment:
            raise HTTPException(
                status_code=403,
                detail="You can only view health logs for patients linked to your appointments."
            )

        return requested_patient_id

    return await resolve_patient_id(current_user)


@router.post("/daily_health_logs")
async def create_health_log(
    log: DailyHealthLogCreate,
    current_user: dict = Depends(verify_token)
):
    log_dict = log.dict(exclude_none=True)
    patient_id = await resolve_patient_id(current_user)
    now = datetime.utcnow()

    update_fields = {
        **log_dict,
        "patient_id": patient_id,
        "updated_at": now
    }

    try:
        await database.daily_health_logs.update_one(
            {
                "patient_id": patient_id,
                "log_date": log.log_date
            },
            {
                "$set": update_fields,
                "$setOnInsert": {
                    "created_at": now
                }
            },
            upsert=True
        )
        saved_log = await database.daily_health_logs.find_one(
            {
                "patient_id": patient_id,
                "log_date": log.log_date
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save daily health log: {exc}")

    if not saved_log:
        raise HTTPException(status_code=500, detail="Saved daily health log could not be loaded")

    return serialize_health_log(saved_log)


@router.get("/daily_health_logs")
async def get_health_logs(
    patient_id: str | None = Query(default=None),
    log_date: str | None = Query(default=None),
    current_user: dict = Depends(verify_token)
):
    resolved_patient_id = await resolve_requested_patient_id(current_user, patient_id)
    query = {"patient_id": resolved_patient_id}

    if log_date:
        query["log_date"] = log_date

    logs = []

    try:
        async for log in database.daily_health_logs.find(query).sort("log_date", -1):
            logs.append(serialize_health_log(log))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load daily health logs: {exc}")

    return logs
