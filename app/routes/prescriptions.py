from fastapi import APIRouter
from app.database import database
from app.schemas.prescription import PrescriptionCreate

router = APIRouter()

@router.post("/prescriptions")
async def create_prescription(prescription: PrescriptionCreate):
    result = await database.prescriptions.insert_one(prescription.dict())
    return {"id": str(result.inserted_id)}


@router.get("/prescriptions")
async def get_prescriptions():
    prescriptions = []
    async for prescription in database.prescriptions.find():
        prescription["_id"] = str(prescription["_id"])
        prescriptions.append(prescription)
    return prescriptions