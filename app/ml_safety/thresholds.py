from __future__ import annotations

from dataclasses import dataclass
from typing import Any


DAILY_HEALTH_ENTRY_RULE_RANGES: dict[str, dict[str, Any]] = {
    "systolic_bp": {
        "label": "Systolic BP",
        "unit": "mmHg",
        "normal": (90, 139),
        "warning": [(140, 179), (None, 89)],
        "emergency": [(180, None)],
    },
    "diastolic_bp": {
        "label": "Diastolic BP",
        "unit": "mmHg",
        "normal": (60, 89),
        "warning": [(90, 119), (None, 59)],
        "emergency": [(120, None)],
    },
    "heart_rate": {
        "label": "Heart rate",
        "unit": "bpm",
        "normal": (60, 100),
        "warning": [(101, 129), (50, 59)],
        "emergency": [(130, None), (None, 49)],
    },
    "o2_saturation": {
        "label": "Oxygen saturation",
        "unit": "%",
        "normal": (95, 100),
        "warning": [(90, 94)],
        "emergency": [(None, 89)],
    },
    "fasting_blood_glucose": {
        "label": "Fasting blood glucose",
        "unit": "mg/dL",
        "normal": (70, 99),
        "warning": [(100, 125), (None, 69)],
        "emergency": [(126, None)],
    },
    "post_prandial_glucose": {
        "label": "Post-prandial glucose",
        "unit": "mg/dL",
        "normal": (70, 139),
        "warning": [(140, 199), (None, 69)],
        "emergency": [(200, None)],
    },
    "cholesterol": {
        "label": "Total cholesterol",
        "unit": "mg/dL",
        "normal": (0, 199),
        "warning": [(200, 239)],
        "emergency": [(240, None)],
    },
    "temperature": {
        "label": "Temperature",
        "unit": "C",
        "normal": (36.1, 37.2),
        "warning": [(37.3, 37.9), (35.0, 36.0)],
        "emergency": [(38.0, None), (None, 34.9)],
    },
}


@dataclass(frozen=True)
class PersonalizedBaseline:
    sbp: float
    dbp: float
    hr: float
    o2_saturation: float
    fbs: float
    ppbs: float
    cholesterol: float


def _is_value_in_range(value: float, range_pair: tuple[float | None, float | None]) -> bool:
    low, high = range_pair
    if low is not None and value < low:
        return False
    if high is not None and value > high:
        return False
    return True


def classify_daily_health_entry(field: str, value: float | int | None) -> str:
    if value is None or field not in DAILY_HEALTH_ENTRY_RULE_RANGES:
        return "unknown"

    numeric_value = float(value)
    ranges = DAILY_HEALTH_ENTRY_RULE_RANGES[field]

    if any(_is_value_in_range(numeric_value, range_pair) for range_pair in ranges["emergency"]):
        return "emergency"

    if any(_is_value_in_range(numeric_value, range_pair) for range_pair in ranges["warning"]):
        return "warning"

    if _is_value_in_range(numeric_value, ranges["normal"]):
        return "normal"

    return "warning"


def is_daily_health_log_abnormal(log: dict) -> bool:
    for field in DAILY_HEALTH_ENTRY_RULE_RANGES:
        if classify_daily_health_entry(field, log.get(field)) in {"warning", "emergency"}:
            return True

    return False


def derive_personalized_baseline(patient: dict) -> PersonalizedBaseline:
    """Shift acceptable vitals based on known disease history."""
    has_hypertension = bool(patient.get("has_hypertension", False))
    has_diabetes = bool(patient.get("has_diabetes", False))
    has_cardiac_history = bool(patient.get("has_cardiac_history", False))

    sbp = 120 + (20 if has_hypertension else 0) + (5 if has_cardiac_history else 0)
    dbp = 80 + (10 if has_hypertension else 0)
    hr = 72 + (8 if has_cardiac_history else 0)
    o2_saturation = 90
    fbs = 95 + (20 if has_diabetes else 0)
    ppbs = 126 + (25 if has_diabetes else 0)
    cholesterol = 180 + (25 if has_cardiac_history else 0)

    return PersonalizedBaseline(
        sbp=sbp,
        dbp=dbp,
        hr=hr,
        o2_saturation=o2_saturation,
        fbs=fbs,
        ppbs=ppbs,
        cholesterol=cholesterol,
    )


def classify_risk(patient: dict) -> str:
    baseline = derive_personalized_baseline(patient)
    has_bp_or_cardiac_history = bool(patient.get("has_hypertension", False)) or bool(patient.get("has_cardiac_history", False))

    sbp = float(patient["sbp"])
    dbp = float(patient["dbp"])
    hr = float(patient["hr"])
    o2_saturation = float(patient["o2_saturation"])
    fbs = float(patient["fbs"])
    ppbs = float(patient["ppbs"])
    cholesterol = float(patient["cholesterol"])

    if has_bp_or_cardiac_history:
        emergency_bp_checks = [
            sbp >= baseline.sbp + 15,
            dbp >= baseline.dbp + 15,
        ]
        if any(emergency_bp_checks):
            return "emergency"

        warning_bp_checks = [
            sbp >= baseline.sbp + 10,
            dbp >= baseline.dbp + 10,
        ]
        if any(warning_bp_checks):
            return "warning"

    emergency_checks = [
        abs(sbp - baseline.sbp) > 30,
        abs(dbp - baseline.dbp) > 20,
        abs(hr - baseline.hr) > 35,
        o2_saturation < baseline.o2_saturation - 8,
        fbs > baseline.fbs + 80 or fbs < baseline.fbs - 35,
        ppbs > baseline.ppbs + 100,
        cholesterol > baseline.cholesterol + 90,
    ]
    if any(emergency_checks):
        return "emergency"

    warning_checks = [
        abs(sbp - baseline.sbp) > 10,
        abs(dbp - baseline.dbp) > 10,
        abs(hr - baseline.hr) > 20,
        o2_saturation < baseline.o2_saturation - 3,
        fbs > baseline.fbs + 25 or fbs < baseline.fbs - 15,
        ppbs > baseline.ppbs + 40,
        cholesterol > baseline.cholesterol + 30,
    ]
    if any(warning_checks):
        return "warning"

    return "normal"


def estimate_rule_confidence(patient: dict, label: str) -> float:
    baseline = derive_personalized_baseline(patient)
    has_bp_or_cardiac_history = bool(patient.get("has_hypertension", False)) or bool(patient.get("has_cardiac_history", False))

    sbp_delta = float(patient["sbp"]) - baseline.sbp
    dbp_delta = float(patient["dbp"]) - baseline.dbp

    if has_bp_or_cardiac_history and label == "emergency":
        strongest_delta = max(sbp_delta, dbp_delta)
        return round(min(0.99, 0.85 + max(0.0, strongest_delta - 15) / 100), 4)

    if has_bp_or_cardiac_history and label == "warning":
        strongest_delta = max(sbp_delta, dbp_delta)
        return round(min(0.84, 0.65 + max(0.0, strongest_delta - 10) / 50), 4)

    if label == "emergency":
        return 0.88

    if label == "warning":
        return 0.72

    return 0.9

