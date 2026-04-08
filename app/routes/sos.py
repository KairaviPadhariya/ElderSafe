from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import database
from app.schemas.sos import SOSCreate
from app.utils.auth import verify_token

router = APIRouter()
SOS_ACTIVE_WINDOW = timedelta(hours=24)


async def resolve_linked_patient_user_id(patient_reference: str | None) -> str | None:
    if not patient_reference:
        return None

    patient_profile = None
    if ObjectId.is_valid(patient_reference):
        patient_profile = await database.patients.find_one({"_id": ObjectId(patient_reference)})

    if patient_profile and patient_profile.get("user_id"):
        return str(patient_profile["user_id"])

    return patient_reference


async def get_patient_profile(patient_user_id: str):
    return await database.patients.find_one({"user_id": patient_user_id})


async def find_patient_profile_by_name(patient_name: str | None):
    if not patient_name:
        return None

    return await database.patients.find_one({"name": patient_name})


async def create_direct_family_notifications(patient_name: str | None, sos_id: str) -> int:
    if not patient_name:
        return 0

    created_count = 0

    async for family_member in database.family.find({"patient_name": patient_name}):
        family_user_id = family_member.get("user_id")
        if not family_user_id:
            continue

        await database.notifications.insert_one({
            "user_id": family_user_id,
            "title": "SOS alert received",
            "message": f"{patient_name} triggered an SOS alert. Please check on them immediately.",
            "type": "alert",
            "priority": "high",
            "status": "unread",
            "created_at": datetime.utcnow(),
            "source": "sos",
            "sos_id": sos_id
        })
        created_count += 1

    return created_count


def get_sos_active_cutoff() -> datetime:
    return datetime.utcnow() - SOS_ACTIVE_WINDOW


@router.post("/sos")
async def create_sos(
    sos: SOSCreate,
    current_user: dict = Depends(verify_token)
):
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can trigger SOS alerts."
        )

    sos_dict = sos.dict()
    patient_user_id = current_user["sub"]
    patient_profile = await get_patient_profile(patient_user_id)
    sos_dict["patient_id"] = patient_user_id
    sos_dict["created_by"] = patient_user_id
    sos_dict["created_at"] = datetime.utcnow()

    result = await database.sos.insert_one(sos_dict)

    family_links_count = await database.family.count_documents({"patient_id": patient_user_id})
    if family_links_count == 0:
        if patient_profile:
            family_links_count = await database.family.count_documents({"patient_id": str(patient_profile["_id"])})
    if family_links_count == 0:
        family_links_count = await create_direct_family_notifications(
            (patient_profile or {}).get("name"),
            str(result.inserted_id)
        )

    return {
        "sos_id": str(result.inserted_id),
        "family_notifications_created": family_links_count
    }

@router.get("/sos")
async def get_sos(current_user: dict = Depends(verify_token)):
    role = current_user.get("role")
    query = {
        "status": {"$ne": "resolved"},
        "created_at": {"$gte": get_sos_active_cutoff()}
    }

    if role == "patient":
        query = {"patient_id": current_user["sub"]}
    elif role == "family":
        family_record = await database.family.find_one({"user_id": current_user["sub"]})
        if not family_record:
            return []

        patient_reference = str(family_record["patient_id"]) if family_record.get("patient_id") else None

        if not patient_reference and family_record.get("patient_name"):
            matched_patient_profile = await find_patient_profile_by_name(family_record.get("patient_name"))
            if matched_patient_profile:
                patient_reference = str(matched_patient_profile["_id"])

        if not patient_reference:
            return []

        linked_patient_user_id = await resolve_linked_patient_user_id(patient_reference)
        query = {"patient_id": linked_patient_user_id or patient_reference}

    alerts = []
    async for alert in database.sos.find(query).sort("created_at", -1):
        alert["_id"] = str(alert["_id"])
        alerts.append(alert)
    return alerts
