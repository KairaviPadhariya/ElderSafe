from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.ml_safety.thresholds import derive_personalized_baseline


TARGET_COLUMN = "situation_label"
NUMERIC_COLUMNS = [
    "age",
    "weight",
    "bmi",
    "o2_saturation",
    "hr",
    "sbp",
    "dbp",
    "fbs",
    "ppbs",
    "cholesterol",
    "pulse_pressure",
    "mean_arterial_pressure",
    "glucose_delta",
    "sbp_delta_from_baseline",
    "dbp_delta_from_baseline",
    "hr_delta_from_baseline",
    "o2_delta_from_baseline",
    "fbs_delta_from_baseline",
    "ppbs_delta_from_baseline",
    "cholesterol_delta_from_baseline",
]
CATEGORICAL_COLUMNS = ["gender", "bmi_category"]
BOOLEAN_COLUMNS = [
    "has_hypertension",
    "has_diabetes",
    "has_cardiac_history",
]


@dataclass(frozen=True)
class PreparedDataset:
    features: pd.DataFrame
    target: pd.Series


def clean_health_dataset(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned = cleaned.drop_duplicates().reset_index(drop=True)

    numeric_bounds = {
        "age": (55, 110),
        "weight": (35, 140),
        "bmi": (14, 45),
        "o2_saturation": (70, 100),
        "hr": (30, 200),
        "sbp": (70, 250),
        "dbp": (40, 150),
        "fbs": (40, 400),
        "ppbs": (60, 500),
        "cholesterol": (80, 400),
    }
    for column, (low, high) in numeric_bounds.items():
        if column in cleaned:
            cleaned.loc[(cleaned[column] < low) | (cleaned[column] > high), column] = pd.NA

    return cleaned


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    enriched = df.copy()

    enriched["pulse_pressure"] = enriched["sbp"] - enriched["dbp"]
    enriched["mean_arterial_pressure"] = ((2 * enriched["dbp"]) + enriched["sbp"]) / 3
    enriched["glucose_delta"] = enriched["ppbs"] - enriched["fbs"]
    enriched["bmi_category"] = pd.cut(
        enriched["bmi"],
        bins=[0, 18.5, 25, 30, 100],
        labels=["underweight", "normal", "overweight", "obese"],
        include_lowest=True,
    ).astype("object")

    baseline_columns = {
        "sbp_delta_from_baseline": "sbp",
        "dbp_delta_from_baseline": "dbp",
        "hr_delta_from_baseline": "hr",
        "o2_delta_from_baseline": "o2_saturation",
        "fbs_delta_from_baseline": "fbs",
        "ppbs_delta_from_baseline": "ppbs",
        "cholesterol_delta_from_baseline": "cholesterol",
    }

    baseline_rows = []
    for _, row in enriched.iterrows():
        baseline = derive_personalized_baseline(row.to_dict())
        baseline_rows.append(
            {
                "sbp": baseline.sbp,
                "dbp": baseline.dbp,
                "hr": baseline.hr,
                "o2_saturation": baseline.o2_saturation,
                "fbs": baseline.fbs,
                "ppbs": baseline.ppbs,
                "cholesterol": baseline.cholesterol,
            }
        )

    baselines = pd.DataFrame(baseline_rows)
    for feature_name, base_column in baseline_columns.items():
        enriched[feature_name] = enriched[base_column] - baselines[base_column]

    return enriched


def prepare_training_frame(df: pd.DataFrame) -> PreparedDataset:
    cleaned = clean_health_dataset(df)
    enriched = add_engineered_features(cleaned)
    features = enriched[NUMERIC_COLUMNS + CATEGORICAL_COLUMNS + BOOLEAN_COLUMNS].copy()
    features[BOOLEAN_COLUMNS] = features[BOOLEAN_COLUMNS].astype("int64")
    target = enriched[TARGET_COLUMN].copy()
    return PreparedDataset(features=features, target=target)


def build_preprocessor(scale_numeric: bool) -> ColumnTransformer:
    numeric_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))

    numeric_pipeline = Pipeline(numeric_steps)
    categorical_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_COLUMNS),
            ("cat", categorical_pipeline, CATEGORICAL_COLUMNS),
            ("bool", "passthrough", BOOLEAN_COLUMNS),
        ]
    )
