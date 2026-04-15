from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import database
from app.schemas.sos import SOSCreate
from app.utils.auth import verify_token

router = APIRouter()
SOS_ACTIVE_WINDOW = timedelta(hours=24)


def normalize_name(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


async def user_exists(user_id: str | None) -> bool:
    if not user_id or not ObjectId.is_valid(user_id):
        return False

    return await database.users.count_documents({"_id": ObjectId(user_id)}, limit=1) > 0


async def resolve_linked_patient_user_id(patient_reference: str | None) -> str | None:
    if not patient_reference:
        return None

    patient_profile = None
    if ObjectId.is_valid(patient_reference):
        patient_profile = await database.patients.find_one({"_id": ObjectId(patient_reference)})

    if patient_profile and patient_profile.get("user_id"):
        return str(patient_profile["user_id"])

    return patient_reference


async def build_patient_aliases(patient_reference: str | None) -> list[str]:
    if not patient_reference:
        return []

    aliases = [str(patient_reference)]
    patient_profile = None

    if ObjectId.is_valid(str(patient_reference)):
        patient_profile = await database.patients.find_one({"_id": ObjectId(str(patient_reference))})
    else:
        patient_profile = await database.patients.find_one({"user_id": str(patient_reference)})

    if patient_profile:
        aliases.append(str(patient_profile["_id"]))
        if patient_profile.get("user_id"):
            aliases.append(str(patient_profile["user_id"]))

    deduped_aliases: list[str] = []
    for alias in aliases:
        if alias not in deduped_aliases:
            deduped_aliases.append(alias)

    return deduped_aliases


async def get_patient_profile(patient_user_id: str):
    return await database.patients.find_one({"user_id": patient_user_id})


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

    for patient in exact_matches:
        if await user_exists(patient.get("user_id")):
            return patient

    active_prefix_matches = [patient for patient in prefix_matches if await user_exists(patient.get("user_id"))]
    if len(active_prefix_matches) == 1:
        return active_prefix_matches[0]

    return exact_matches[0] if exact_matches else None


async def create_family_notifications(patient_user_id: str, patient_profile: dict | None, sos_id: str) -> int:
    patient_name = (patient_profile or {}).get("name") or "The patient"
    family_user_ids: list[str] = []
    family_queries = [{"patient_id": patient_user_id}]

    if patient_profile and patient_profile.get("_id"):
        family_queries.append({"patient_id": str(patient_profile["_id"])})

    if patient_profile and patient_profile.get("name"):
        family_queries.append({"patient_name": patient_profile["name"]})

    async for family_member in database.family.find({"$or": family_queries}):
        family_user_id = family_member.get("user_id")
        if family_user_id and family_user_id not in family_user_ids:
            family_user_ids.append(family_user_id)

    created_count = 0
    for family_user_id in family_user_ids:
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

    family_links_count = await create_family_notifications(
        patient_user_id,
        patient_profile,
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
        patient_aliases = await build_patient_aliases(current_user["sub"])
        query["$or"] = [
            {"patient_id": {"$in": patient_aliases or [current_user["sub"]]}},
            {"created_by": {"$in": patient_aliases or [current_user["sub"]]}}
        ]
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

        linked_patient_user_id = await resolve_linked_patient_user_id(patient_reference) or patient_reference
        patient_aliases = await build_patient_aliases(linked_patient_user_id)
        if patient_reference not in patient_aliases:
            patient_aliases.append(patient_reference)

        query["$or"] = [
            {"patient_id": {"$in": patient_aliases}},
            {"created_by": {"$in": patient_aliases}}
        ]

    alerts = []
    async for alert in database.sos.find(query).sort("created_at", -1):
        alert["_id"] = str(alert["_id"])
        alerts.append(alert)
    return alerts
