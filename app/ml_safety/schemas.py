from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class SafetyPredictionRequest(BaseModel):
    patient_id: Optional[str] = None
    doctor_contact: Optional[str] = None
    family_contact: Optional[str] = None
    age: int = Field(..., ge=55, le=110)
    gender: str
    weight: float
    bmi: float
    o2_saturation: float
    hr: float
    sbp: float
    dbp: float
    fbs: float
    ppbs: float
    cholesterol: float
    has_hypertension: bool = False
    has_diabetes: bool = False
    has_cardiac_history: bool = False


class TrainModelsRequest(BaseModel):
    source: str = Field(default="local_csv", description="local_csv, mongo, or synthetic")
    csv_path: str = "senior_citizen_safety_dataset.csv"
    collection_name: str = "senior_safety_dataset"
    n_samples: int = Field(default=2500, ge=500, le=20000)
    missing_rate: float = Field(default=0.03, ge=0.0, le=0.2)
    random_state: int = 42


class DatasetImportRequest(BaseModel):
    csv_path: str = "senior_citizen_safety_dataset.csv"
    collection_name: str = "senior_safety_dataset"
    replace: bool = True


class MonitoringRecord(BaseModel):
    log_date: str
    hr: float
    sbp: float
    dbp: float
    o2_saturation: float
    fbs: Optional[float] = None
    ppbs: Optional[float] = None


class MonitoringRequest(BaseModel):
    records: list[MonitoringRecord]
