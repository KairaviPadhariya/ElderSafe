from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import database, client
from app.ml_safety.router import router as ml_safety_router
from app.routes import (
    users,
    patients,
    doctors,
    appointments,
    medications,
    activity_logs,
    contact_logs,
    audit_logs,
    family,
    daily_health_logs,
    health_trends,
    medical_history,
    notifications,
    prescriptions,
    sos,
    medical_documents
)

app = FastAPI()

ALLOWED_ORIGINS = [
    "http://100.50.8.161:5173",
    "http://100.50.8.161:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

LOCAL_DEV_ORIGIN_REGEX = (
    r"^https?://("
    r"100\.50\.8\.161|"
    r"localhost|"
    r"127\.0\.0\.1|"
    r"0\.0\.0\.0|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=LOCAL_DEV_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(medications.router)
app.include_router(activity_logs.router)
app.include_router(contact_logs.router)
app.include_router(audit_logs.router)
app.include_router(family.router)
app.include_router(daily_health_logs.router)
app.include_router(health_trends.router)
app.include_router(medical_history.router)
app.include_router(notifications.router)
app.include_router(prescriptions.router)
app.include_router(sos.router)
app.include_router(medical_documents.router)
app.include_router(ml_safety_router)


@app.get("/health")
def health():
    return {"status": "Backend is running 🚀"}


@app.get("/db-test")
async def db_test():
    try:
        collections = await database.list_collection_names()
        return {"connected": True, "collections": collections}
    except Exception as e:
        return {"connected": False, "error": str(e)}

@app.get("/")
def test():
    return {"message": "Backend working"}
