from fastapi import APIRouter
from app.database import database
from app.schemas.doctor import DoctorCreate
from datetime import datetime

router = APIRouter()

@router.post("/doctors")
async def create_doctor(doctor: DoctorCreate):

    doctor_dict = doctor.dict()
    doctor_dict["created_at"] = datetime.utcnow()

    result = await database.doctors.insert_one(doctor_dict)

    return {"id": str(result.inserted_id)}


@router.get("/doctors")
async def get_doctors():
    doctors = []
    async for doctor in database.doctors.find():
        doctor["_id"] = str(doctor["_id"])
        doctors.append(doctor)
    return doctors