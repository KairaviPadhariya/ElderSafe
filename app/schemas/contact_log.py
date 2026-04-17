from pydantic import BaseModel, EmailStr


class ContactLogCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
