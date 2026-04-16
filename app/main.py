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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://34.233.187.127",
        "http://34.233.187.127:5173"
    ],
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