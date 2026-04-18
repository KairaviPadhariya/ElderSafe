from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import database
from app.schemas.medication import DoctorMedicationCreate, MedicationCreate, MedicationLogCreate
from app.utils.auth import verify_token

router = APIRouter()


def serialize_medication(medication: dict):
    medication["_id"] = str(medication["_id"])

    for field in ("created_at", "updated_at"):
        if isinstance(medication.get(field), datetime):
            medication[field] = medication[field].isoformat()

    medication["refill"] = build_refill_summary(medication)

    return medication


def serialize_medication_log(log: dict):
    log["_id"] = str(log["_id"])
    if isinstance(log.get("medication_id"), ObjectId):
        log["medication_id"] = str(log["medication_id"])

    for field in ("created_at", "updated_at"):
        if isinstance(log.get(field), datetime):
            log[field] = log[field].isoformat()

    return log


async def find_patient_profile_by_name(patient_name: str | None):
    if not patient_name:
        return None

    return await database.patients.find_one({"name": patient_name})


async def find_patient_profile_by_reference(patient_reference: str | None, patient_name: str | None = None):
    patient_profile = None

    if patient_reference and ObjectId.is_valid(str(patient_reference)):
        patient_profile = await database.patients.find_one({"_id": ObjectId(str(patient_reference))})

    if not patient_profile and patient_reference:
        patient_profile = await database.patients.find_one({"user_id": str(patient_reference)})

    if not patient_profile and patient_name:
        patient_profile = await find_patient_profile_by_name(patient_name)

    return patient_profile


async def resolve_doctor_profile(current_user: dict):
    doctor_profile = await database.doctors.find_one({"user_id": current_user["sub"]})

    if not doctor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complete the doctor profile first to prescribe medications."
        )

    return doctor_profile


async def resolve_patient_profile(current_user: dict):
    if current_user.get("role") == "family":
        family_record = await database.family.find_one({"user_id": current_user["sub"]})

        if not family_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Complete the family profile first to link a patient."
            )

        patient_reference = family_record.get("patient_id")
        patient_profile = None

        if patient_reference and ObjectId.is_valid(str(patient_reference)):
            patient_profile = await database.patients.find_one({"_id": ObjectId(str(patient_reference))})

        if not patient_profile:
            patient_profile = await find_patient_profile_by_name(family_record.get("patient_name"))

        if not patient_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Linked patient record was not found."
            )

        return patient_profile

    patient_profile = await database.patients.find_one({"user_id": current_user["sub"]})
    if not patient_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complete the patient profile first to manage medications."
        )

    return patient_profile


def is_medication_active_for_date(medication: dict, target_date: str) -> bool:
    start_date = medication.get("start_date")
    end_date = medication.get("end_date")

    if not start_date:
        return False

    if start_date > target_date:
        return False

    if end_date and end_date < target_date:
        return False

    return True


def calculate_end_date(start_date: str, duration_days: int) -> str:
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = start + timedelta(days=duration_days - 1)
    return end.isoformat()


def build_refill_summary(medication: dict):
    start_date = medication.get("start_date")
    duration_days = medication.get("duration_days")
    end_date = medication.get("end_date")

    if not start_date or not duration_days or not end_date:
        return {
            "days_remaining": None,
            "status": "unknown",
            "label": "Refill data unavailable"
        }

    today = datetime.utcnow().date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()
    days_remaining = (end - today).days + 1

    if days_remaining <= 0:
        return {
            "days_remaining": 0,
            "status": "refill_due",
            "label": "Refill due now"
        }

    if days_remaining <= 3:
        return {
            "days_remaining": days_remaining,
            "status": "refill_soon",
            "label": f"Refill in {days_remaining} day{'s' if days_remaining != 1 else ''}"
        }

    return {
        "days_remaining": days_remaining,
        "status": "active",
        "label": f"{days_remaining} day{'s' if days_remaining != 1 else ''} remaining"
    }


def get_default_times(frequency: str) -> list[str]:
    normalized = frequency.lower()

    if "twice" in normalized:
        return ["08:00", "20:00"]
    if "three" in normalized or "thrice" in normalized:
        return ["08:00", "14:00", "20:00"]
    if "four" in normalized:
        return ["06:00", "12:00", "18:00", "22:00"]

    return ["08:00"]


def format_time_label(time_value: str) -> str:
    try:
        return datetime.strptime(time_value, "%H:%M").strftime("%I:%M %p").lstrip("0")
    except ValueError:
        return time_value


async def build_daily_schedule(patient_id: str, target_date: str):
    medications = []
    async for medication in database.medications_doctor.find({"patient_id": patient_id}).sort("created_at", -1):
        medications.append(medication)

    medication_ids = [record["_id"] for record in medications]
    logs_by_key = {}

    if medication_ids:
        async for log in database.medications_patient.find({
            "patient_id": patient_id,
            "log_date": target_date,
            "medication_id": {"$in": medication_ids}
        }):
            logs_by_key[f"{log['medication_id']}::{log['scheduled_time']}"] = log

    schedule = []

    for medication in medications:
        if not is_medication_active_for_date(medication, target_date):
            continue

        times = medication.get("times") or get_default_times(medication.get("frequency") or "")

        for time_value in times:
            log = logs_by_key.get(f"{medication['_id']}::{time_value}")
            dose_status = (log or {}).get("status") or "pending"
            schedule.append({
                "medication_id": str(medication["_id"]),
                "medicine_name": medication.get("medicine_name") or "Medication",
                "dosage": medication.get("dosage") or "",
                "frequency": medication.get("frequency") or "",
                "instructions": medication.get("instructions"),
                "scheduled_time": time_value,
                "scheduled_label": format_time_label(time_value),
                "status": dose_status,
                "log_id": str(log["_id"]) if log else None,
                "log_date": target_date
            })

    schedule.sort(key=lambda item: item["scheduled_time"])
    return schedule


def build_schedule_summary(schedule: list[dict]):
    pending = [item for item in schedule if item["status"] == "pending"]
    taken = [item for item in schedule if item["status"] == "taken"]
    skipped = [item for item in schedule if item["status"] == "skipped"]
    missed = [item for item in schedule if item["status"] == "missed"]
    next_dose = pending[0] if pending else None

    return {
        "total_doses": len(schedule),
        "taken_count": len(taken),
        "pending_count": len(pending),
        "skipped_count": len(skipped),
        "missed_count": len(missed),
        "next_dose": next_dose
    }


@router.post("/medications")
async def create_medication(
    medication: MedicationCreate,
    current_user: dict = Depends(verify_token)
):
    if current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can prescribe medications."
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Doctors should prescribe medications from an appointment."
    )


@router.post("/appointments/{appointment_id}/medications")
async def create_medication_from_appointment(
    appointment_id: str,
    medication: DoctorMedicationCreate,
    current_user: dict = Depends(verify_token)
):
    if current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can prescribe medications."
        )

    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Invalid appointment ID.")

    doctor_profile = await resolve_doctor_profile(current_user)
    appointment = await database.appointments.find_one({
        "_id": ObjectId(appointment_id),
        "doctor_id": str(doctor_profile["_id"])
    })

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    patient_profile = await find_patient_profile_by_reference(
        appointment.get("patient_id"),
        appointment.get("patient_name")
    )

    if not patient_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient record linked to this appointment was not found."
        )

    now = datetime.utcnow()
    medication_dict = medication.dict(exclude_none=True)
    medication_dict["patient_id"] = str(patient_profile["_id"])
    medication_dict["created_by"] = current_user["sub"]
    medication_dict["created_at"] = now
    medication_dict["updated_at"] = now
    medication_dict["appointment_id"] = appointment_id
    medication_dict["prescribed_by_doctor_id"] = str(doctor_profile["_id"])
    medication_dict["prescribed_by_user_id"] = current_user["sub"]
    medication_dict["prescribed_by_name"] = doctor_profile.get("name") or "Doctor"
    medication_dict["doctor_note"] = (medication.doctor_note or "").strip() or None
    medication_dict["end_date"] = calculate_end_date(
        medication.start_date,
        medication.duration_days
    )

    if not medication_dict.get("times"):
        medication_dict["times"] = get_default_times(medication.frequency)

    result = await database.medications_doctor.insert_one(medication_dict)
    saved_medication = await database.medications_doctor.find_one({"_id": result.inserted_id})

    if not saved_medication:
        raise HTTPException(status_code=500, detail="Saved medication could not be loaded.")

    return serialize_medication(saved_medication)


@router.get("/medications")
async def get_medications(current_user: dict = Depends(verify_token)):
    patient_profile = await resolve_patient_profile(current_user)
    medications = []

    async for medication in database.medications_doctor.find({"patient_id": str(patient_profile["_id"])}).sort("created_at", -1):
        medications.append(serialize_medication(medication))

    return medications


@router.get("/medications/today")
async def get_today_medications(
    date: str | None = Query(default=None),
    current_user: dict = Depends(verify_token)
):
    patient_profile = await resolve_patient_profile(current_user)
    target_date = date or datetime.utcnow().date().isoformat()
    schedule = await build_daily_schedule(str(patient_profile["_id"]), target_date)

    return {
        "date": target_date,
        "patient_id": str(patient_profile["_id"]),
        "schedule": schedule,
        "summary": build_schedule_summary(schedule)
    }


@router.post("/medications/{medication_id}/log")
async def log_medication_dose(
    medication_id: str,
    payload: MedicationLogCreate,
    current_user: dict = Depends(verify_token)
):
    patient_profile = await resolve_patient_profile(current_user)

    if not ObjectId.is_valid(medication_id):
        raise HTTPException(status_code=400, detail="Invalid medication ID.")

    medication = await database.medications_doctor.find_one({
        "_id": ObjectId(medication_id),
        "patient_id": str(patient_profile["_id"])
    })

    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found.")

    target_date = payload.log_date or datetime.utcnow().date().isoformat()
    now = datetime.utcnow()
    update_fields = {
        "patient_id": str(patient_profile["_id"]),
        "medication_id": ObjectId(medication_id),
        "medicine_name": medication.get("medicine_name"),
        "scheduled_time": payload.scheduled_time,
        "status": payload.status,
        "log_date": target_date,
        "updated_at": now,
        "updated_by": current_user["sub"]
    }

    await database.medications_patient.update_one(
        {
            "patient_id": str(patient_profile["_id"]),
            "medication_id": ObjectId(medication_id),
            "scheduled_time": payload.scheduled_time,
            "log_date": target_date
        },
        {
            "$set": update_fields,
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True
    )

    saved_log = await database.medications_patient.find_one({
        "patient_id": str(patient_profile["_id"]),
        "medication_id": ObjectId(medication_id),
        "scheduled_time": payload.scheduled_time,
        "log_date": target_date
    })

    if not saved_log:
        raise HTTPException(status_code=500, detail="Medication log could not be loaded.")

    return serialize_medication_log(saved_log)
