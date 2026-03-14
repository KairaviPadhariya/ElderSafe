from fastapi import APIRouter
from app.database import database
from app.schemas.patient import PatientCreate
from datetime import datetime

router = APIRouter()

@router.post("/patients")
async def create_patient(patient: PatientCreate):
    patient_dict = patient.dict()
    patient_dict["created_at"] = datetime.utcnow()
    result = await database.patients.insert_one(patient_dict)
    return {"id": str(result.inserted_id)}


@router.get("/patients")
async def get_patients():
    patients = []
    async for patient in database.patients.find():
        patient["_id"] = str(patient["_id"])
        patients.append(patient)
    return patients