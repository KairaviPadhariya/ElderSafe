from __future__ import annotations

from typing import Any


def build_alert_payload(prediction: str, probabilities: dict[str, float], patient_data: dict[str, Any]) -> dict[str, Any]:
    channels = []
    if prediction == "warning":
        channels = ["notification"]
    elif prediction == "emergency":
        channels = ["notification", "emergency_contact", "sos"]

    return {
        "patient_id": patient_data.get("patient_id"),
        "status": prediction,
        "channels": channels,
        "confidence": round(probabilities.get(prediction, 0.0), 4),
        "doctor_contact": patient_data.get("doctor_contact"),
        "family_contact": patient_data.get("family_contact"),
        "recommended_action": _recommended_action(prediction),
    }


def _recommended_action(prediction: str) -> str:
    if prediction == "emergency":
        return "Call emergency contact, notify assigned doctor, and request immediate check-in."
    if prediction == "warning":
        return "Notify family and doctor dashboard, then schedule a follow-up health review."
    return "Vitals are normal."

