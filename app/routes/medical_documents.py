from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from bson import ObjectId
from bson.binary import Binary
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, Response

from app.database import database
from app.utils.auth import verify_token

router = APIRouter()

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "medical_documents"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def serialize_document(document: dict):
    uploaded_at = document.get("uploaded_at")

    if isinstance(uploaded_at, datetime):
        if uploaded_at.tzinfo is None:
            uploaded_at = uploaded_at.replace(tzinfo=timezone.utc)
        else:
            uploaded_at = uploaded_at.astimezone(timezone.utc)

    return {
        "id": str(document["_id"]),
        "filename": document.get("filename"),
        "content_type": document.get("content_type"),
        "size": document.get("size"),
        "uploaded_at": (
            uploaded_at.isoformat().replace("+00:00", "Z")
            if isinstance(uploaded_at, datetime)
            else document.get("uploaded_at")
        )
    }


def sanitize_filename(filename: str) -> str:
    safe_name = Path(filename or "document").name.strip()
    return safe_name or "document"


async def resolve_patient_context(current_user: dict) -> tuple[str, list[str]]:
    if current_user.get("role") != "family":
        patient_id = current_user["sub"]
        aliases: list[str] = [patient_id]

        patient_profile = await database.patients.find_one({"user_id": patient_id})
        if patient_profile:
            aliases.append(str(patient_profile["_id"]))
            if patient_profile.get("user_id"):
                aliases.append(str(patient_profile["user_id"]))

        deduped_aliases = list(dict.fromkeys([alias for alias in aliases if alias]))
        return patient_id, deduped_aliases

    family_record = await database.family.find_one({"user_id": current_user["sub"]})

    if not family_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete the family profile first to link a patient."
        )

    patient_reference = family_record.get("patient_id")
    patient_profile = None
    patient_user = None

    if patient_reference and ObjectId.is_valid(str(patient_reference)):
        patient_profile = await database.patients.find_one({"_id": ObjectId(str(patient_reference))})

    if not patient_profile and patient_reference:
        patient_profile = await database.patients.find_one({"user_id": str(patient_reference)})

    if not patient_profile and family_record.get("patient_name"):
        patient_profile = await database.patients.find_one({"name": family_record["patient_name"]})

    patient_name = family_record.get("patient_name") or (patient_profile or {}).get("name")

    if patient_profile and patient_profile.get("user_id") and ObjectId.is_valid(str(patient_profile["user_id"])):
        patient_user = await database.users.find_one({"_id": ObjectId(str(patient_profile["user_id"]))})

    if not patient_user and patient_name:
        patient_user = await database.users.find_one({"name": patient_name})

    aliases: list[str] = []
    primary_patient_id = None

    if patient_profile:
        primary_patient_id = str(patient_profile.get("user_id") or patient_profile["_id"])
        aliases.append(str(patient_profile["_id"]))
        if patient_profile.get("user_id"):
            aliases.append(str(patient_profile["user_id"]))

    if patient_user:
        aliases.append(str(patient_user["_id"]))
        if not primary_patient_id:
            primary_patient_id = str(patient_user["_id"])

    if patient_reference:
        aliases.append(str(patient_reference))

    deduped_aliases = list(dict.fromkeys([alias for alias in aliases if alias]))

    if not primary_patient_id and deduped_aliases:
        primary_patient_id = deduped_aliases[0]

    if not primary_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete the family profile first to link a patient."
        )

    return primary_patient_id, deduped_aliases


async def get_doctor_profile_id(user_id: str) -> str | None:
    doctor = await database.doctors.find_one({"user_id": user_id})

    if not doctor:
        return None

    return str(doctor["_id"])


async def resolve_requested_patient_context(current_user: dict, requested_patient_id: str | None) -> tuple[str, list[str]]:
    if current_user.get("role") != "doctor":
        return await resolve_patient_context(current_user)

    if not requested_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select a patient before viewing medical documents."
        )

    doctor_profile_id = await get_doctor_profile_id(current_user["sub"])

    if not doctor_profile_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete the doctor profile first to access patient documents."
        )

    aliases: list[str] = [requested_patient_id]
    patient_profile = None

    if ObjectId.is_valid(requested_patient_id):
        patient_profile = await database.patients.find_one({"_id": ObjectId(requested_patient_id)})

    if not patient_profile:
        patient_profile = await database.patients.find_one({"user_id": requested_patient_id})

    if patient_profile:
        aliases.append(str(patient_profile["_id"]))
        if patient_profile.get("user_id"):
            aliases.append(str(patient_profile["user_id"]))

    deduped_aliases = list(dict.fromkeys([alias for alias in aliases if alias]))

    appointment = await database.appointments.find_one({
        "doctor_id": doctor_profile_id,
        "patient_id": {"$in": deduped_aliases}
    })

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view documents for patients linked to your appointments."
        )

    primary_patient_id = str((patient_profile or {}).get("user_id") or requested_patient_id)
    return primary_patient_id, deduped_aliases


def build_document_access_query(patient_ids: list[str]) -> dict:
    return {
        "$or": [
            {"patient_id": {"$in": patient_ids}},
            {"uploaded_by": {"$in": patient_ids}},
        ]
    }


async def get_document_for_patient(document_id: str, patient_ids: list[str]):
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID.")

    document = await database.medical_documents.find_one({
        "_id": ObjectId(document_id),
        **build_document_access_query(patient_ids)
    })

    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    return document


@router.post("/medical-documents")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    patient_id, _ = await resolve_patient_context(current_user)
    original_name = sanitize_filename(file.filename or "document")
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPG, JPEG, and PNG files are allowed."
        )

    file_data = await file.read()
    if not file_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size must be 10 MB or less.")

    patient_directory = UPLOAD_ROOT / patient_id
    patient_directory.mkdir(parents=True, exist_ok=True)

    stored_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid4().hex}{extension}"
    stored_path = patient_directory / stored_name
    stored_path.write_bytes(file_data)

    document = {
        "patient_id": patient_id,
        "filename": original_name,
        "stored_name": stored_name,
        "storage_path": str(stored_path),
        "content_type": file.content_type or "application/octet-stream",
        "size": len(file_data),
        "file_bytes": Binary(file_data),
        "uploaded_by": current_user["sub"],
        "uploaded_at": datetime.utcnow()
    }

    result = await database.medical_documents.insert_one(document)
    saved_document = await database.medical_documents.find_one({"_id": result.inserted_id})

    if not saved_document:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Saved document could not be loaded.")

    return serialize_document(saved_document)


@router.get("/medical-documents")
async def list_documents(
    patient_id: str | None = Query(default=None),
    current_user: dict = Depends(verify_token)
):
    _, patient_ids = await resolve_requested_patient_context(current_user, patient_id)
    documents = []

    async for document in database.medical_documents.find(build_document_access_query(patient_ids)).sort("uploaded_at", -1):
        documents.append(serialize_document(document))

    return documents


@router.get("/medical-documents/{document_id}")
async def download_document(
    document_id: str,
    patient_id: str | None = Query(default=None),
    current_user: dict = Depends(verify_token)
):
    _, patient_ids = await resolve_requested_patient_context(current_user, patient_id)
    document = await get_document_for_patient(document_id, patient_ids)
    storage_path = Path(document.get("storage_path") or "")
    media_type = document.get("content_type") or "application/octet-stream"
    filename = document.get("filename") or storage_path.name or "document"
    file_bytes = document.get("file_bytes")

    if file_bytes:
        return Response(
            content=bytes(file_bytes),
            media_type=media_type,
            headers={
                "Content-Disposition": f'inline; filename="{filename}"'
            }
        )

    if storage_path.exists():
        return FileResponse(
            path=storage_path,
            media_type=media_type,
            filename=filename
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Stored file was not found for this legacy upload. Please re-upload it once so it is available across devices."
    )
