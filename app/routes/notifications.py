from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.database import database
from app.schemas.notification import NotificationCreate
from app.utils.auth import verify_token

router = APIRouter()
SOS_ACTIVE_WINDOW = timedelta(hours=24)
NOTIFICATION_RETENTION_WINDOW = timedelta(hours=24)


def get_sos_active_cutoff() -> datetime:
    return datetime.utcnow() - SOS_ACTIVE_WINDOW


def get_notification_retention_cutoff() -> datetime:
    return datetime.utcnow() - NOTIFICATION_RETENTION_WINDOW


def build_notification(notification_id: str, title: str, message: str, created_at, type_: str, priority: str):
    timestamp = created_at if isinstance(created_at, datetime) else datetime.utcnow()

    return {
        "id": notification_id,
        "title": title,
        "message": message,
        "time": format_relative_time(timestamp),
        "created_at": timestamp.isoformat(),
        "type": type_,
        "priority": priority,
    }


def format_relative_time(timestamp: datetime) -> str:
    delta = datetime.utcnow() - timestamp

    if delta < timedelta(minutes=1):
        return "Just now"

    if delta < timedelta(hours=1):
        minutes = max(int(delta.total_seconds() // 60), 1)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"

    if delta < timedelta(days=1):
        hours = max(int(delta.total_seconds() // 3600), 1)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"

    if delta < timedelta(days=7):
        days = delta.days
        return f"{days} day{'s' if days != 1 else ''} ago"

    return timestamp.strftime("%b %d, %Y")


def parse_appointment_datetime(appointment: dict) -> datetime | None:
    date_value = appointment.get("date")
    time_value = appointment.get("time")

    if not date_value or not time_value:
        return None

    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(f"{date_value} {time_value}", fmt)
        except ValueError:
            continue

    return None


def is_health_log_abnormal(log: dict) -> bool:
    systolic = log.get("systolic_bp")
    diastolic = log.get("diastolic_bp")
    heart_rate = log.get("heart_rate")
    fasting = log.get("fasting_blood_glucose")
    post_prandial = log.get("post_prandial_glucose")
    temperature = log.get("temperature")

    return any([
        systolic is not None and systolic >= 140,
        diastolic is not None and diastolic >= 90,
        heart_rate is not None and (heart_rate < 60 or heart_rate > 100),
        fasting is not None and fasting >= 126,
        post_prandial is not None and post_prandial >= 200,
        temperature is not None and temperature >= 38.0,
    ])


async def get_user_name(user_id: str) -> str:
    profile = await database.patients.find_one({"user_id": user_id})
    if profile and profile.get("name"):
        return profile["name"]

    user = None
    if ObjectId.is_valid(user_id):
        user = await database.users.find_one({"_id": ObjectId(user_id)})

    return (user or {}).get("name") or "Patient"


async def get_doctor_profile(user_id: str):
    return await database.doctors.find_one({"user_id": user_id})


async def get_family_record(user_id: str):
    return await database.family.find_one({"user_id": user_id})


async def find_patient_profile_by_name(patient_name: str | None):
    if not patient_name:
        return None

    return await database.patients.find_one({"name": patient_name})


async def resolve_linked_patient_user_id(patient_reference: str | None) -> str | None:
    if not patient_reference:
        return None

    patient_profile = None
    if ObjectId.is_valid(patient_reference):
        patient_profile = await database.patients.find_one({"_id": ObjectId(patient_reference)})

    if patient_profile and patient_profile.get("user_id"):
        return str(patient_profile["user_id"])

    return patient_reference


async def build_patient_aliases(patient_reference: str | None) -> list[str]:
    if not patient_reference:
        return []

    aliases = [str(patient_reference)]
    patient_profile = None

    if ObjectId.is_valid(str(patient_reference)):
        patient_profile = await database.patients.find_one({"_id": ObjectId(str(patient_reference))})
    else:
        patient_profile = await database.patients.find_one({"user_id": str(patient_reference)})

    if patient_profile:
        aliases.append(str(patient_profile["_id"]))
        if patient_profile.get("user_id"):
            aliases.append(str(patient_profile["user_id"]))

    deduped_aliases: list[str] = []
    for alias in aliases:
        if alias not in deduped_aliases:
            deduped_aliases.append(alias)

    return deduped_aliases


async def get_latest_health_log(patient_id: str):
    return await database.daily_health_logs.find_one(
        {"patient_id": patient_id},
        sort=[("log_date", -1), ("updated_at", -1)]
    )


async def get_patient_profile_by_user_id(user_id: str):
    return await database.patients.find_one({"user_id": user_id})


async def get_active_sos_notifications(patient_ids: list[str], label: str):
    notifications = []
    if not patient_ids:
        return notifications

    async for alert in database.sos.find({
        "$or": [
            {"patient_id": {"$in": patient_ids}},
            {"created_by": {"$in": patient_ids}}
        ],
        "status": {"$ne": "resolved"},
        "created_at": {"$gte": get_sos_active_cutoff()}
    }).sort("created_at", -1):
        location = alert.get("location") or "Location unavailable"
        status = alert.get("status") or "active"
        notifications.append(
            build_notification(
                f"sos-{alert['_id']}",
                f"SOS alert for {label}",
                f"Emergency status is {status}. Last known location: {location}.",
                alert.get("created_at") or datetime.utcnow(),
                "alert",
                "high"
            )
        )

    return notifications


async def get_upcoming_appointment_notifications(query: dict, label_builder):
    notifications = []
    now = datetime.utcnow()
    today = now.date().isoformat()

    async for appointment in database.appointments.find({
        **query,
        "status": {"$ne": "cancelled"},
        "date": {"$gte": today}
    }).sort([("date", 1), ("time", 1)]).limit(3):
        appointment_datetime = parse_appointment_datetime(appointment)
        if appointment_datetime and appointment_datetime < now:
            continue

        notifications.append(
            build_notification(
                f"appointment-{appointment['_id']}",
                "Upcoming appointment",
                label_builder(appointment),
                appointment.get("updated_at") or appointment.get("created_at") or datetime.utcnow(),
                "appointment",
                "medium"
            )
        )

    return notifications


async def get_document_notifications(user_ids: list[str], label: str):
    notifications = []

    if not user_ids:
        return notifications

    async for document in database.medical_documents.find({
        "uploaded_by": {"$in": user_ids}
    }).sort("uploaded_at", -1).limit(2):
        filename = document.get("filename") or "medical document"
        notifications.append(
            build_notification(
                f"document-{document['_id']}",
                "Medical document uploaded",
                f"{label}: {filename} is now available in the record.",
                document.get("uploaded_at") or datetime.utcnow(),
                "report",
                "low"
            )
        )

    return notifications


async def get_medication_notifications(patient_id: str, label: str):
    count = await database.medications.count_documents({"patient_id": patient_id})

    if count == 0:
        return []

    latest_medication = await database.medications.find_one(
        {"patient_id": patient_id},
        sort=[("created_at", -1)]
    )
    medication_name = (latest_medication or {}).get("medicine_name") or "medication"
    created_at = (latest_medication or {}).get("created_at") or datetime.utcnow()

    return [
        build_notification(
            f"medication-summary-{patient_id}",
            "Medication plan available",
            f"{label} has {count} medication entr{'y' if count == 1 else 'ies'} on file. Latest: {medication_name}.",
            created_at,
            "medication",
            "low"
        )
    ]


async def build_patient_notifications(current_user: dict):
    patient_id = current_user["sub"]
    patient_profile = await get_patient_profile_by_user_id(patient_id)
    medication_patient_id = str(patient_profile["_id"]) if patient_profile else patient_id
    patient_aliases = await build_patient_aliases(patient_id)
    notifications = []

    notifications.extend(await get_active_sos_notifications(patient_aliases or [patient_id], "you"))
    notifications.extend(await get_upcoming_appointment_notifications(
        {"patient_id": patient_id},
        lambda appointment: (
            f"Visit with {appointment.get('doctor_name') or 'your doctor'} on "
            f"{appointment.get('date')} at {appointment.get('time')}."
        )
    ))

    today = datetime.utcnow().date().isoformat()
    today_log = await database.daily_health_logs.find_one({"patient_id": patient_id, "log_date": today})
    if not today_log:
        notifications.append(
            build_notification(
                f"daily-log-missing-{patient_id}-{today}",
                "Daily health log pending",
                f"You have not recorded your vitals for {today} yet.",
                datetime.utcnow(),
                "alert",
                "medium"
            )
        )

    latest_log = await get_latest_health_log(patient_id)
    if latest_log and is_health_log_abnormal(latest_log):
        notifications.append(
            build_notification(
                f"health-log-alert-{latest_log['_id']}",
                "Abnormal vitals detected",
                "Your latest health log has readings outside the normal range. Please review it or contact your doctor.",
                latest_log.get("updated_at") or latest_log.get("created_at") or datetime.utcnow(),
                "alert",
                "high"
            )
        )

    notifications.extend(await get_medication_notifications(medication_patient_id, "You"))
    notifications.extend(await get_document_notifications([patient_id], "Your record"))

    return notifications


async def build_family_notifications(current_user: dict):
    family_record = await get_family_record(current_user["sub"])

    if not family_record:
        return [
            build_notification(
                f"family-link-missing-{current_user['sub']}",
                "Patient link required",
                "Complete the family profile to connect notifications to a patient.",
                datetime.utcnow(),
                "user",
                "medium"
            )
        ]

    patient_reference = str(family_record["patient_id"]) if family_record.get("patient_id") else None
    matched_patient_profile = None

    if not patient_reference and family_record.get("patient_name"):
        matched_patient_profile = await find_patient_profile_by_name(family_record.get("patient_name"))
        if matched_patient_profile:
            patient_reference = str(matched_patient_profile["_id"])

    if not patient_reference:
        return [
            build_notification(
                f"family-link-missing-{current_user['sub']}",
                "Patient link required",
                "Complete the family profile to connect notifications to a patient.",
                datetime.utcnow(),
                "user",
                "medium"
            )
        ]

    sos_patient_id = await resolve_linked_patient_user_id(patient_reference) or patient_reference
    sos_patient_aliases = await build_patient_aliases(sos_patient_id)
    if patient_reference not in sos_patient_aliases:
        sos_patient_aliases.append(patient_reference)
    patient_name = (
        family_record.get("patient_name")
        or (matched_patient_profile or {}).get("name")
        or await get_user_name(patient_reference)
    )
    notifications = []

    notifications.extend(await get_active_sos_notifications(sos_patient_aliases, patient_name))
    notifications.extend(await get_upcoming_appointment_notifications(
        {"patient_id": patient_reference},
        lambda appointment: (
            f"{patient_name} has an appointment with {appointment.get('doctor_name') or 'the doctor'} on "
            f"{appointment.get('date')} at {appointment.get('time')}."
        )
    ))

    today = datetime.utcnow().date().isoformat()
    today_log = await database.daily_health_logs.find_one({"patient_id": patient_reference, "log_date": today})
    if not today_log:
        notifications.append(
            build_notification(
                f"family-daily-log-missing-{patient_reference}-{today}",
                "Daily log missing",
                f"No daily health log has been saved for {patient_name} today.",
                datetime.utcnow(),
                "alert",
                "medium"
            )
        )

    latest_log = await get_latest_health_log(patient_reference)
    if latest_log and is_health_log_abnormal(latest_log):
        notifications.append(
            build_notification(
                f"family-health-log-alert-{latest_log['_id']}",
                "Vitals need attention",
                f"{patient_name}'s latest daily health log shows readings outside the normal range.",
                latest_log.get("updated_at") or latest_log.get("created_at") or datetime.utcnow(),
                "alert",
                "high"
            )
        )

    notifications.extend(await get_medication_notifications(patient_reference, patient_name))
    notifications.extend(await get_document_notifications([patient_reference], f"{patient_name}'s record"))

    return notifications


async def build_doctor_notifications(current_user: dict):
    doctor = await get_doctor_profile(current_user["sub"])

    if not doctor:
        return [
            build_notification(
                f"doctor-profile-missing-{current_user['sub']}",
                "Doctor profile incomplete",
                "Complete your doctor profile to receive appointment-based notifications.",
                datetime.utcnow(),
                "user",
                "medium"
            )
        ]

    doctor_id = str(doctor["_id"])
    notifications = []
    today = datetime.utcnow().date().isoformat()

    today_count = await database.appointments.count_documents({
        "doctor_id": doctor_id,
        "status": {"$ne": "cancelled"},
        "date": today
    })
    if today_count > 0:
        notifications.append(
            build_notification(
                f"doctor-today-summary-{doctor_id}-{today}",
                "Today's appointments",
                f"You have {today_count} appointment{'s' if today_count != 1 else ''} scheduled for today.",
                datetime.utcnow(),
                "appointment",
                "medium"
            )
        )

    patient_ids = []
    async for appointment in database.appointments.find({"doctor_id": doctor_id}):
        patient_id = appointment.get("patient_id")
        if patient_id and patient_id not in patient_ids:
            patient_ids.append(patient_id)

    async for appointment in database.appointments.find({
        "doctor_id": doctor_id,
        "status": {"$ne": "cancelled"},
        "date": {"$gte": today}
    }).sort([("date", 1), ("time", 1)]).limit(3):
        patient_name = await get_user_name(appointment.get("patient_id") or "")
        notifications.append(
            build_notification(
                f"doctor-appointment-{appointment['_id']}",
                "Upcoming patient visit",
                f"{patient_name} is scheduled on {appointment.get('date')} at {appointment.get('time')}.",
                appointment.get("updated_at") or appointment.get("created_at") or datetime.utcnow(),
                "appointment",
                "medium"
            )
        )

    for patient_id in patient_ids[:5]:
        patient_name = await get_user_name(patient_id)

        latest_log = await get_latest_health_log(patient_id)
        if latest_log and is_health_log_abnormal(latest_log):
            notifications.append(
                build_notification(
                    f"doctor-health-alert-{latest_log['_id']}",
                    "Patient vitals alert",
                    f"{patient_name}'s latest daily health log contains readings outside the normal range.",
                    latest_log.get("updated_at") or latest_log.get("created_at") or datetime.utcnow(),
                    "alert",
                    "high"
                )
            )

    notifications.extend(await get_document_notifications(patient_ids[:5], "Patient document"))

    return notifications


@router.post("/notifications")
async def create_notification(
    notification: NotificationCreate,
    current_user: dict = Depends(verify_token)
):
    notification_dict = notification.dict(exclude_none=True)
    notification_dict["user_id"] = notification_dict.get("user_id") or current_user["sub"]
    notification_dict["created_at"] = datetime.utcnow()

    result = await database.notifications.insert_one(notification_dict)

    return {"notification_id": str(result.inserted_id)}


@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(verify_token)):
    role = current_user.get("role")
    notifications = []
    sos_cutoff = get_sos_active_cutoff()
    retention_cutoff = get_notification_retention_cutoff()

    stored_notifications = []
    async for record in database.notifications.find({
        "user_id": current_user["sub"],
        "created_at": {"$gte": retention_cutoff}
    }).sort("created_at", -1):
        created_at = record.get("created_at") or datetime.utcnow()
        if record.get("source") == "sos" and created_at < sos_cutoff:
            continue

        stored_notifications.append(
            build_notification(
                f"stored-{record['_id']}",
                record.get("title") or "Notification",
                record.get("message") or "",
                created_at,
                record.get("type") or "user",
                record.get("priority") or "low"
            )
        )

    notifications.extend(stored_notifications)

    if role == "doctor":
        notifications.extend(await build_doctor_notifications(current_user))
    elif role == "family":
        notifications.extend(await build_family_notifications(current_user))
    else:
        notifications.extend(await build_patient_notifications(current_user))

    notifications = [
        notification
        for notification in notifications
        if datetime.fromisoformat(notification["created_at"]) >= retention_cutoff
    ]
    notifications.sort(key=lambda item: item["created_at"], reverse=True)
    return notifications[:12]


@router.get("/notifications/count")
async def get_notifications_count(current_user: dict = Depends(verify_token)):
    notifications = await get_notifications(current_user)
    return {"count": len(notifications)}
