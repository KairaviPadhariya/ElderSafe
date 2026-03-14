from fastapi import APIRouter, Depends
from app.utils.auth import verify_token
from app.database import database
from app.schemas.medical_document import MedicalDocumentCreate
from datetime import datetime

router = APIRouter()

@router.post("/medical_documents")
async def create_document(doc: MedicalDocumentCreate):
    doc_dict = doc.dict()
    doc_dict["created_at"] = datetime.utcnow()
    result = await database.medical_documents.insert_one(doc_dict)
    return {"id": str(result.inserted_id)}


@router.get("/medical_documents")
async def get_medical_documents(current_user: str = Depends(verify_token)):
    documents = []
    async for doc in database.medical_documents.find():
        doc["_id"] = str(doc["_id"])
        documents.append(doc)
    return documents