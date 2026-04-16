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


def parse_log_timestamp(log: dict) -> datetime:
    for field in ("updated_at", "created_at"):
        value = log.get(field)
        if isinstance(value, datetime):
            return value

        if isinstance(value, str):
            normalized = value.replace("Z", "+00:00")
            try:
                return datetime.fromisoformat(normalized)
            except ValueError:
                continue

    return datetime.min


def normalize_name(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


async def find_patient_profile_by_name(patient_name: str | None):
    if not patient_name:
        return None

    normalized_query = normalize_name(patient_name)
    exact_matches: list[dict] = []
    prefix_matches: list[dict] = []

    async for patient in database.patients.find({}):
        candidate_name = normalize_name(patient.get("name"))
        if not candidate_name:
            continue

        if candidate_name == normalized_query:
            exact_matches.append(patient)
        elif normalized_query and candidate_name.startswith(f"{normalized_query} "):
            prefix_matches.append(patient)

    if exact_matches:
        return exact_matches[0]

    if len(prefix_matches) == 1:
        return prefix_matches[0]

    return None


def dedupe_preserve_order(values: list[str | None]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []

    for value in values:
        normalized = str(value).strip() if value is not None else ""
        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        ordered.append(normalized)

    return ordered


async def build_patient_aliases_from_profile(
    patient_profile: dict | None,
    patient_reference: str | None = None
) -> tuple[str | None, list[str]]:
    aliases = dedupe_preserve_order([
        str(patient_profile.get("user_id")) if patient_profile and patient_profile.get("user_id") else None,
        str(patient_profile.get("_id")) if patient_profile and patient_profile.get("_id") else None,
        patient_reference,
    ])

    primary_patient_id = aliases[0] if aliases else None
    return primary_patient_id, aliases


async def resolve_patient_context(current_user: dict) -> tuple[str, list[str]]:
    if current_user.get("role") != "family":
        patient_profile = await database.patients.find_one({"user_id": current_user["sub"]})
        primary_patient_id, aliases = await build_patient_aliases_from_profile(patient_profile, current_user["sub"])

        if not primary_patient_id:
            primary_patient_id = current_user["sub"]
            aliases = [current_user["sub"]]

        return primary_patient_id, aliases

    family_record = await database.family.find_one({"user_id": current_user["sub"]})

    if not family_record:
        raise HTTPException(
            status_code=400,
            detail="Complete the family profile first to link a patient."
        )

    patient_reference = family_record.get("patient_id")
    patient_profile = None

    if patient_reference and ObjectId.is_valid(str(patient_reference)):
        patient_profile = await database.patients.find_one({"_id": ObjectId(str(patient_reference))})

    if not patient_profile and patient_reference:
        patient_profile = await database.patients.find_one({"user_id": str(patient_reference)})

    if not patient_profile and family_record.get("patient_name"):
        patient_profile = await find_patient_profile_by_name(family_record.get("patient_name"))

    resolved_patient_id, aliases = await build_patient_aliases_from_profile(
        patient_profile,
        str(patient_reference) if patient_reference else None
    )

    if not resolved_patient_id or not aliases:
        raise HTTPException(
            status_code=400,
            detail="Complete the family profile first to link a patient."
        )

    return resolved_patient_id, aliases


async def get_doctor_profile_id(user_id: str) -> str | None:
    doctor = await database.doctors.find_one({"user_id": user_id})

    if not doctor:
        return None

    return str(doctor["_id"])


async def resolve_requested_patient_context(current_user: dict, requested_patient_id: str | None) -> tuple[str, list[str]]:
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
        if not patient_profile:
            patient_profile = await database.patients.find_one({"user_id": requested_patient_id})

        if patient_profile and patient_profile.get("user_id"):
            allowed_patient_ids.add(str(patient_profile["user_id"]))
        if patient_profile and patient_profile.get("_id"):
            allowed_patient_ids.add(str(patient_profile["_id"]))

        appointment = await database.appointments.find_one({
            "doctor_id": doctor_profile_id,
            "patient_id": {"$in": list(allowed_patient_ids)}
        })

        if not appointment:
            raise HTTPException(
                status_code=403,
                detail="You can only view health logs for patients linked to your appointments."
            )

        primary_patient_id = str((patient_profile or {}).get("user_id") or requested_patient_id)
        return primary_patient_id, dedupe_preserve_order(list(allowed_patient_ids))

    return await resolve_patient_context(current_user)


@router.post("/daily_health_logs")
async def create_health_log(
    log: DailyHealthLogCreate,
    current_user: dict = Depends(verify_token)
):
    log_dict = log.dict(exclude_none=True)
    patient_id, patient_aliases = await resolve_patient_context(current_user)
    now = datetime.utcnow()

    update_fields = {
        **log_dict,
        "patient_id": patient_id,
        "updated_at": now
    }

    try:
        await database.daily_health_logs.update_one(
            {
                "patient_id": {"$in": patient_aliases},
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
    _, patient_aliases = await resolve_requested_patient_context(current_user, patient_id)
    query = {"patient_id": {"$in": patient_aliases}}

    if log_date:
        query["log_date"] = log_date

    logs_by_date: dict[str, dict] = {}

    try:
        async for log in database.daily_health_logs.find(query).sort([("log_date", -1), ("updated_at", -1), ("created_at", -1)]):
            serialized_log = serialize_health_log(log)
            log_date_value = serialized_log.get("log_date")

            if not log_date_value:
                continue

            existing_log = logs_by_date.get(log_date_value)
            if not existing_log or parse_log_timestamp(serialized_log) >= parse_log_timestamp(existing_log):
                logs_by_date[log_date_value] = serialized_log
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load daily health logs: {exc}")

    logs = sorted(logs_by_date.values(), key=lambda item: item.get("log_date", ""), reverse=True)
    return logs