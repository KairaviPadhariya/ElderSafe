from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.ml_safety.data_sources import (
    fetch_dataset_records,
    import_local_dataset_to_mongo,
    load_local_training_dataset,
    load_training_dataset_from_mongo,
)
from app.ml_safety.inference import predict_situation, summarize_daily_monitoring
from app.ml_safety.schemas import DatasetImportRequest, MonitoringRequest, SafetyPredictionRequest, TrainModelsRequest
from app.ml_safety.synthetic_data import generate_senior_health_dataset, save_dataset
from app.ml_safety.trainer import train_and_evaluate_models


router = APIRouter(prefix="/ml-safety", tags=["Senior Safety ML"])
ARTIFACT_DIR = Path("artifacts") / "ml_safety"


@router.get("/health")
async def ml_health() -> dict[str, str]:
    return {"status": "Senior Safety ML service is ready"}


@router.post("/train")
async def train_models(request: TrainModelsRequest) -> dict:
    if request.source == "local_csv":
        dataset = load_local_training_dataset(request.csv_path)
        dataset_path = save_dataset(dataset, ARTIFACT_DIR / "dataset" / "training_dataset_from_local_csv.csv")
    elif request.source == "mongo":
        dataset = await load_training_dataset_from_mongo(request.collection_name)
        dataset_path = save_dataset(dataset, ARTIFACT_DIR / "dataset" / "training_dataset_from_mongo.csv")
    elif request.source == "synthetic":
        dataset = generate_senior_health_dataset(
            n_samples=request.n_samples,
            missing_rate=request.missing_rate,
            random_state=request.random_state,
        )
        dataset_path = save_dataset(dataset, ARTIFACT_DIR / "dataset" / "synthetic_senior_health.csv")
    else:
        raise HTTPException(status_code=400, detail="Unsupported source. Use local_csv, mongo, or synthetic.")

    summary = train_and_evaluate_models(dataset, ARTIFACT_DIR / "models", random_state=request.random_state)
    return {
        "source": request.source,
        "dataset_path": str(dataset_path),
        "artifact_directory": str((ARTIFACT_DIR / "models").resolve()),
        "summary": summary,
    }


@router.post("/dataset/import-local")
async def import_local_dataset(request: DatasetImportRequest) -> dict:
    return await import_local_dataset_to_mongo(
        path=request.csv_path,
        collection_name=request.collection_name,
        replace=request.replace,
    )


@router.get("/dataset/records")
async def get_dataset_records(collection_name: str = "senior_safety_dataset", limit: int = 100) -> dict:
    records = await fetch_dataset_records(collection_name=collection_name, limit=limit)
    return {"collection": collection_name, "count": len(records), "records": records}


@router.post("/predict")
async def predict_health_state(request: SafetyPredictionRequest) -> dict:
    model_path = ARTIFACT_DIR / "models" / "best_model.pkl"
    try:
        result = predict_situation(model_path, request.model_dump())
        return result
    except ValueError as error:
        raise HTTPException(
            status_code=500,
            detail=f"ML model artifact is incompatible with the current feature schema. Retrain the model. Original error: {error}",
        ) from error


@router.post("/monitor")
async def monitor_daily_health(request: MonitoringRequest) -> dict:
    return summarize_daily_monitoring([record.model_dump() for record in request.records])
