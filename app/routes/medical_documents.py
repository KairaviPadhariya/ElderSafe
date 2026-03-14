from fastapi import APIRouter
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
async def get_documents():
    documents = []
    async for doc in database.medical_documents.find():
        doc["_id"] = str(doc["_id"])
        documents.append(doc)
    return documents