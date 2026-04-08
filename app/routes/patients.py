from fastapi import APIRouter, Depends
from app.utils.auth import verify_token
from app.database import database
from app.schemas.patient import PatientCreate
from datetime import datetime

router = APIRouter()

@router.post("/patients")
async def create_patient(patient: PatientCreate, current_user: dict = Depends(verify_token)):
    patient_dict = patient.dict()
    patient_dict["user_id"] = current_user["sub"]
    patient_dict["updated_at"] = datetime.utcnow()

    result = await database.patients.update_one(
        {"user_id": current_user["sub"]},
        {
            "$set": patient_dict,
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )

    saved_patient = await database.patients.find_one({"user_id": current_user["sub"]})

    return {
        "id": str(saved_patient["_id"]),
        "created": result.upserted_id is not None,
        "updated": result.matched_count > 0
    }


@router.get("/patients/me")
async def get_my_patient(current_user: dict = Depends(verify_token)):
    patient = await database.patients.find_one({"user_id": current_user["sub"]})

    if not patient:
        return None

    patient["_id"] = str(patient["_id"])
    return patient


@router.get("/patients")
async def get_patients(current_user: str = Depends(verify_token)):
    patients = []
    async for patient in database.patients.find():
        patient["_id"] = str(patient["_id"])
        patients.append(patient)
    return patients
