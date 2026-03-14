from fastapi import APIRouter
from app.database import database
from app.schemas.medication import MedicationCreate
from datetime import datetime

router = APIRouter()

@router.post("/medications")
async def create_medication(medication: MedicationCreate):
    medication_dict = medication.dict()
    medication_dict["created_at"] = datetime.utcnow()
    result = await database.medications.insert_one(medication_dict)
    return {"id": str(result.inserted_id)}


@router.get("/medications")
async def get_medications():
    medications = []
    async for medication in database.medications.find():
        medication["_id"] = str(medication["_id"])
        medications.append(medication)
    return medications