from typing import Optional

from pydantic import BaseModel, Field


class DailyHealthLogCreate(BaseModel):
    log_date: str = Field(..., description="Date in YYYY-MM-DD format")
    systolic_bp: int
    diastolic_bp: int
    heart_rate: int
    o2_saturation: Optional[int] = None
    fasting_blood_glucose: Optional[int] = None
    post_prandial_glucose: Optional[int] = None
    weight: Optional[float] = None
    temperature: Optional[float] = None
    notes: Optional[str] = None
