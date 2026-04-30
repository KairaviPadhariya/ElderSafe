from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from app.ml_safety.alerting import build_alert_payload
from app.ml_safety.preprocessing import BOOLEAN_COLUMNS, add_engineered_features
from app.ml_safety.thresholds import classify_risk, derive_personalized_baseline, estimate_rule_confidence
from app.ml_safety.trainer import load_model


LEGACY_FEATURE_DEFAULTS: dict[str, Any] = {
    "has_copd": False,
}


def _align_features_for_model(model: Any, features: pd.DataFrame) -> pd.DataFrame:
    aligned = features.copy()
    expected_columns = getattr(model, "feature_names_in_", None)

    if expected_columns is None:
        for column, default_value in LEGACY_FEATURE_DEFAULTS.items():
            if column not in aligned.columns:
                aligned[column] = default_value
        return aligned

    for column in expected_columns:
        if column not in aligned.columns:
            aligned[column] = LEGACY_FEATURE_DEFAULTS.get(column, pd.NA)

    return aligned


def predict_situation(model_path: str | Path, patient_payload: dict[str, Any]) -> dict[str, Any]:
    model = load_model(model_path)
    frame = pd.DataFrame([patient_payload])
    features = add_engineered_features(frame)
    features = _align_features_for_model(model, features)
    features[BOOLEAN_COLUMNS] = features[BOOLEAN_COLUMNS].astype("int64")
    model_prediction = model.predict(features)[0]

    probabilities: dict[str, float] = {}
    if hasattr(model, "predict_proba"):
        probability_values = model.predict_proba(features)[0]
        for index, label in enumerate(model.classes_):
            probabilities[str(label)] = round(float(probability_values[index]), 4)

    baseline = derive_personalized_baseline(patient_payload)
    rule_based_label = classify_risk(patient_payload)
    prediction = rule_based_label
    probabilities[prediction] = max(
        probabilities.get(prediction, 0.0),
        estimate_rule_confidence(patient_payload, prediction),
    )
    alert_payload = build_alert_payload(prediction, probabilities, patient_payload)

    return {
        "prediction": prediction,
        "model_prediction": model_prediction,
        "rule_based_label": rule_based_label,
        "probabilities": probabilities,
        "personalized_baseline": baseline.__dict__,
        "alert": alert_payload,
    }


def summarize_daily_monitoring(records: list[dict[str, Any]]) -> dict[str, Any]:
    frame = pd.DataFrame(records)
    if frame.empty:
        return {"trend": "unknown", "message": "No records supplied."}

    frame = frame.sort_values("log_date")
    latest = frame.iloc[-1].to_dict()
    rolling_hr = frame["hr"].tail(3).mean() if "hr" in frame else None
    rolling_o2 = frame["o2_saturation"].tail(3).mean() if "o2_saturation" in frame else None
    rolling_sbp = frame["sbp"].tail(3).mean() if "sbp" in frame else None

    signals = []
    if rolling_hr and rolling_hr > 105:
        signals.append("Heart rate trend is elevated.")
    if rolling_o2 and rolling_o2 < 93:
        signals.append("Oxygen saturation trend is declining.")
    if rolling_sbp and rolling_sbp > 145:
        signals.append("Systolic blood pressure trend is above the recommended range.")

    return {
        "latest_record": latest,
        "trend": "warning" if signals else "stable",
        "signals": signals,
        "rolling_metrics": {
            "hr_last_3_avg": None if rolling_hr is None else round(float(rolling_hr), 2),
            "o2_last_3_avg": None if rolling_o2 is None else round(float(rolling_o2), 2),
            "sbp_last_3_avg": None if rolling_sbp is None else round(float(rolling_sbp), 2),
        },
    }
