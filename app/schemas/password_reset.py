from pydantic import BaseModel, EmailStr


class PasswordResetCheck(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    new_password: str
