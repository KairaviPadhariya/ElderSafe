from typing import Literal, Optional

from pydantic import BaseModel, Field


class MedicationCreate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    times: list[str] = Field(default_factory=list)
    instructions: Optional[str] = None
    start_date: str
    duration_days: int = Field(..., ge=1)


class MedicationLogCreate(BaseModel):
    scheduled_time: str
    status: Literal["taken", "skipped", "missed"]
    log_date: Optional[str] = None
