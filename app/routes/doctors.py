from fastapi import APIRouter, Depends
from app.database import database
from app.schemas.doctor import DoctorCreate
from datetime import datetime
from app.utils.auth import verify_token

router = APIRouter()

@router.post("/doctors")
async def create_doctor(doctor: DoctorCreate, current_user: dict = Depends(verify_token)):

    doctor_dict = doctor.dict()
    doctor_dict["user_id"] = current_user["sub"]
    doctor_dict["updated_at"] = datetime.utcnow()

    result = await database.doctors.update_one(
        {"user_id": current_user["sub"]},
        {
            "$set": doctor_dict,
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )

    saved_doctor = await database.doctors.find_one({"user_id": current_user["sub"]})

    return {
        "id": str(saved_doctor["_id"]),
        "created": result.upserted_id is not None,
        "updated": result.matched_count > 0
    }


@router.get("/doctors/me")
async def get_my_doctor(current_user: dict = Depends(verify_token)):
    doctor = await database.doctors.find_one({"user_id": current_user["sub"]})

    if not doctor:
        return None

    doctor["_id"] = str(doctor["_id"])
    return doctor


@router.get("/doctors")
async def get_doctors():
    doctors = []
    async for doctor in database.doctors.find():
        doctor["_id"] = str(doctor["_id"])
        doctors.append(doctor)
    return doctors
