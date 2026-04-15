from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from app.database import database


LOCAL_DATASET_PATH = Path("senior_citizen_safety_dataset.csv")
DEFAULT_DATASET_COLLECTION = "senior_safety_dataset"

CSV_TO_MODEL_COLUMNS = {
    "Age": "age",
    "Gender": "gender",
    "Weight": "weight",
    "BMI": "bmi",
    "O2 saturation": "o2_saturation",
    "HR": "hr",
    "SBP": "sbp",
    "DBP": "dbp",
    "FBS": "fbs",
    "PPBS": "ppbs",
    "Cholesterol": "cholesterol",
    "Health_Status": "situation_label",
}


def normalize_training_dataset(df: pd.DataFrame) -> pd.DataFrame:
    normalized = df.copy().rename(columns=CSV_TO_MODEL_COLUMNS)

    expected_columns = list(CSV_TO_MODEL_COLUMNS.values())
    for column in expected_columns:
        if column not in normalized.columns:
            normalized[column] = pd.NA

    normalized["gender"] = normalized["gender"].astype(str).str.strip().str.lower()
    normalized["situation_label"] = normalized["situation_label"].astype(str).str.strip().str.lower()

    for boolean_column in ["has_hypertension", "has_diabetes", "has_cardiac_history"]:
        if boolean_column not in normalized.columns:
            normalized[boolean_column] = False

    return normalized[
        [
            "age",
            "gender",
            "weight",
            "bmi",
            "o2_saturation",
            "hr",
            "sbp",
            "dbp",
            "fbs",
            "ppbs",
            "cholesterol",
            "has_hypertension",
            "has_diabetes",
            "has_cardiac_history",
            "situation_label",
        ]
    ]


def load_local_training_dataset(path: str | Path = LOCAL_DATASET_PATH) -> pd.DataFrame:
    dataset = pd.read_csv(path)
    return normalize_training_dataset(dataset)


def dataframe_to_mongo_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    records = df.to_dict(orient="records")
    for record in records:
        for key, value in list(record.items()):
            if pd.isna(value):
                record[key] = None
    return records


async def import_local_dataset_to_mongo(
    path: str | Path = LOCAL_DATASET_PATH,
    collection_name: str = DEFAULT_DATASET_COLLECTION,
    replace: bool = True,
) -> dict[str, Any]:
    dataset = load_local_training_dataset(path)
    collection = database[collection_name]

    if replace:
        await collection.delete_many({})

    records = dataframe_to_mongo_records(dataset)
    if records:
        await collection.insert_many(records)

    return {
        "collection": collection_name,
        "records_imported": len(records),
        "source_path": str(Path(path).resolve()),
    }


async def load_training_dataset_from_mongo(
    collection_name: str = DEFAULT_DATASET_COLLECTION,
    limit: int | None = None,
) -> pd.DataFrame:
    cursor = database[collection_name].find()
    if limit:
        cursor = cursor.limit(limit)

    records = []
    async for record in cursor:
        record.pop("_id", None)
        records.append(record)

    if not records:
        raise ValueError(f"No records found in MongoDB collection '{collection_name}'.")

    return normalize_training_dataset(pd.DataFrame(records))


async def fetch_dataset_records(
    collection_name: str = DEFAULT_DATASET_COLLECTION,
    limit: int = 100,
) -> list[dict[str, Any]]:
    records = []
    async for record in database[collection_name].find().limit(limit):
        record["_id"] = str(record["_id"])
        records.append(record)
    return records
