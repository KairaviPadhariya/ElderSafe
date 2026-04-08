from pydantic import BaseModel

class MedicalDocumentCreate(BaseModel):
    patient_id: str
    document_type: str
    file_url: str
    description: str