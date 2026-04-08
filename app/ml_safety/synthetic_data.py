from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from app.ml_safety.thresholds import classify_risk, derive_personalized_baseline


RANDOM_SEED = 42


def _sample_gender(rng: np.random.Generator) -> str:
    return rng.choice(["male", "female"], p=[0.48, 0.52]).item()


def _bounded_normal(rng: np.random.Generator, mean: float, std: float, low: float, high: float) -> float:
    return float(np.clip(rng.normal(mean, std), low, high))


def generate_senior_health_dataset(
    n_samples: int = 2500,
    missing_rate: float = 0.03,
    random_state: int = RANDOM_SEED,
) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)
    rows: list[dict] = []

    for _ in range(n_samples):
        age = int(rng.integers(60, 96))
        gender = _sample_gender(rng)
        height_m = _bounded_normal(rng, 1.58, 0.09, 1.4, 1.9)
        weight = _bounded_normal(rng, 66, 12, 40, 120)
        bmi = weight / (height_m**2)

        has_hypertension = bool(rng.random() < 0.45)
        has_diabetes = bool(rng.random() < 0.35)
        has_copd = bool(rng.random() < 0.18)
        has_cardiac_history = bool(rng.random() < 0.22)

        patient = {
            "has_hypertension": has_hypertension,
            "has_diabetes": has_diabetes,
            "has_copd": has_copd,
            "has_cardiac_history": has_cardiac_history,
        }
        baseline = derive_personalized_baseline(patient)

        severity = rng.choice(["stable", "warning", "emergency"], p=[0.62, 0.26, 0.12]).item()
        sbp_shift = {"stable": 0, "warning": rng.uniform(12, 22), "emergency": rng.uniform(28, 55)}[severity]
        dbp_shift = {"stable": 0, "warning": rng.uniform(8, 16), "emergency": rng.uniform(18, 32)}[severity]
        hr_shift = {"stable": 0, "warning": rng.uniform(12, 28), "emergency": rng.uniform(30, 55)}[severity]
        o2_shift = {"stable": 0, "warning": rng.uniform(3, 6), "emergency": rng.uniform(8, 14)}[severity]
        glucose_shift = {"stable": 0, "warning": rng.uniform(25, 45), "emergency": rng.uniform(60, 120)}[severity]
        cholesterol_shift = {"stable": 0, "warning": rng.uniform(25, 45), "emergency": rng.uniform(60, 110)}[severity]

        sbp_direction = -1 if rng.random() < 0.18 and severity != "stable" else 1
        dbp_direction = -1 if rng.random() < 0.18 and severity != "stable" else 1
        hr_direction = -1 if rng.random() < 0.12 and severity != "stable" else 1
        fbs_direction = -1 if rng.random() < 0.10 and severity != "stable" else 1

        row = {
            "age": age,
            "gender": gender,
            "weight": round(weight, 2),
            "bmi": round(bmi, 2),
            "o2_saturation": round(_bounded_normal(rng, baseline.o2_saturation - o2_shift, 1.8, 78, 100), 2),
            "hr": round(_bounded_normal(rng, baseline.hr + (hr_shift * hr_direction), 8, 35, 170), 2),
            "sbp": round(_bounded_normal(rng, baseline.sbp + (sbp_shift * sbp_direction), 7, 75, 230), 2),
            "dbp": round(_bounded_normal(rng, baseline.dbp + (dbp_shift * dbp_direction), 5, 45, 140), 2),
            "fbs": round(_bounded_normal(rng, baseline.fbs + (glucose_shift * fbs_direction), 14, 50, 320), 2),
            "ppbs": round(_bounded_normal(rng, baseline.ppbs + glucose_shift, 18, 70, 420), 2),
            "cholesterol": round(_bounded_normal(rng, baseline.cholesterol + cholesterol_shift, 15, 100, 360), 2),
            "has_hypertension": has_hypertension,
            "has_diabetes": has_diabetes,
            "has_copd": has_copd,
            "has_cardiac_history": has_cardiac_history,
        }
        row["situation_label"] = classify_risk(row)
        rows.append(row)

    dataset = pd.DataFrame(rows)

    for column in ["weight", "bmi", "o2_saturation", "hr", "sbp", "dbp", "fbs", "ppbs", "cholesterol"]:
        mask = rng.random(len(dataset)) < missing_rate
        dataset.loc[mask, column] = np.nan

    duplicated_rows = dataset.sample(frac=0.02, random_state=random_state, replace=False)
    dataset = pd.concat([dataset, duplicated_rows], ignore_index=True)

    return dataset


def save_dataset(dataset: pd.DataFrame, destination: str | Path) -> Path:
    output_path = Path(destination)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(output_path, index=False)
    return output_path
