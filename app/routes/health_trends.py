from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import database
from app.routes.daily_health_logs import resolve_requested_patient_context, save_prediction_for_log
from app.schemas.health_trend import HealthTrendCreate
from app.utils.auth import verify_token

router = APIRouter()


def serialize_trend(trend: dict):
    trend["_id"] = str(trend["_id"])

    for field in ("created_at", "updated_at"):
        if isinstance(trend.get(field), datetime):
            trend[field] = trend[field].isoformat()

    return trend


def parse_trend_timestamp(trend: dict) -> datetime:
    for field in ("updated_at", "created_at"):
        value = trend.get(field)
        if isinstance(value, datetime):
            return value

        if isinstance(value, str):
            normalized = value.replace("Z", "+00:00")
            try:
                return datetime.fromisoformat(normalized)
            except ValueError:
                continue

    return datetime.min


async def backfill_missing_predictions(patient_id: str, patient_aliases: list[str]) -> None:
    async for log in database.daily_health_logs.find({"patient_id": {"$in": patient_aliases}}):
        log_date = log.get("log_date")
        if not log_date:
            continue

        try:
            await save_prediction_for_log(patient_id, patient_aliases, log)
        except Exception:
            continue


@router.post("/health_trends")
async def create_trend(
    trend: HealthTrendCreate,
    current_user: dict = Depends(verify_token)
):
    requested_patient_id = trend.patient_id
    patient_id, patient_aliases = await resolve_requested_patient_context(current_user, requested_patient_id)
    now = datetime.utcnow()
    trend_date = trend.log_date or trend.date[:10]

    document = {
        "patient_id": patient_id,
        "prediction": trend.prediction,
        "confidence": trend.confidence,
        "date": trend.date,
        "log_date": trend_date,
        "updated_at": now,
    }

    try:
        await database.health_trends.update_one(
            {
                "patient_id": {"$in": patient_aliases},
                "log_date": trend_date,
            },
            {
                "$set": document,
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        saved_trend = await database.health_trends.find_one(
            {
                "patient_id": patient_id,
                "log_date": trend_date,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save health trend: {exc}")

    if not saved_trend:
        raise HTTPException(status_code=500, detail="Saved health trend could not be loaded")

    return serialize_trend(saved_trend)


@router.get("/health_trends")
async def get_trends(
    patient_id: str | None = Query(default=None),
    current_user: dict = Depends(verify_token)
):
    resolved_patient_id, patient_aliases = await resolve_requested_patient_context(current_user, patient_id)
    query = {"patient_id": {"$in": patient_aliases}}
    trends_by_day: dict[str, dict] = {}

    try:
        await backfill_missing_predictions(resolved_patient_id, patient_aliases)

        async for trend in database.health_trends.find(query).sort([("log_date", -1), ("updated_at", -1), ("created_at", -1)]):
            serialized_trend = serialize_trend(trend)
            log_date = serialized_trend.get("log_date") or serialized_trend.get("date", "")[:10]

            if not log_date:
                continue

            existing_trend = trends_by_day.get(log_date)
            if not existing_trend or parse_trend_timestamp(serialized_trend) >= parse_trend_timestamp(existing_trend):
                trends_by_day[log_date] = serialized_trend
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load health trends: {exc}")

    trends = sorted(trends_by_day.values(), key=lambda item: item.get("log_date", ""), reverse=True)
    return trends
