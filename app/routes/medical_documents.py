from fastapi import APIRouter, UploadFile, File, Depends
from app.utils.auth import verify_token
from app.database import database
from datetime import datetime

router = APIRouter()

@router.post("/medical-documents")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    file_data = await file.read()
    document = {
        "filename": file.filename,
        "content": file_data,
        "uploaded_by": current_user["sub"],
        "uploaded_at": datetime.utcnow()
    }
    result = await database.medical_documents.insert_one(document)
    return {
        "message": "Document uploaded",
        "document_id": str(result.inserted_id)
    }

