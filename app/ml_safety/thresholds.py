from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PersonalizedBaseline:
    sbp: float
    dbp: float
    hr: float
    o2_saturation: float
    fbs: float
    ppbs: float
    cholesterol: float


def derive_personalized_baseline(patient: dict) -> PersonalizedBaseline:
    """Shift acceptable vitals based on known disease history."""
    has_hypertension = bool(patient.get("has_hypertension", False))
    has_diabetes = bool(patient.get("has_diabetes", False))
    has_cardiac_history = bool(patient.get("has_cardiac_history", False))

    sbp = 120 + (10 if has_hypertension else 0) + (5 if has_cardiac_history else 0)
    dbp = 80 + (5 if has_hypertension else 0)
    hr = 72 + (8 if has_cardiac_history else 0)
    o2_saturation = 98
    fbs = 95 + (20 if has_diabetes else 0)
    ppbs = 120 + (40 if has_diabetes else 0)
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

    sbp = float(patient["sbp"])
    dbp = float(patient["dbp"])
    hr = float(patient["hr"])
    o2_saturation = float(patient["o2_saturation"])
    fbs = float(patient["fbs"])
    ppbs = float(patient["ppbs"])
    cholesterol = float(patient["cholesterol"])

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

