from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.database import supabase
import traceback
from datetime import datetime

# Import models
from backend.models import Appointment, AvailabilityRequest, AvailabilityResponse

# Import calendar service
from backend.calendar_service import create_calendar_event, check_availability

app = FastAPI()

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (e.g., http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)



@app.get("/")
def home():
    return {"status": "running"}


@app.post("/api/appointments")
async def create_appointment(data: Appointment):
    try:
        appointment = {
            "name": data.name,
            "phone": data.phone,
            "appointment_date": data.appointment_date,
            "appointment_time": data.appointment_time,
            "service_type": data.service_type
        }

        result = (
            supabase
            .table("appointments")
            .insert(appointment)
            .execute()
        )

        calendar = create_calendar_event(
            customer_name=data.name,
            appointment_date=data.appointment_date,
            appointment_time=data.appointment_time
        )
        print(calendar["id"])

        return {
            "success": True,
            "message": "Appointment booked successfully",
            "data": result.data
        }
    except Exception as e:
        with open("error_log.txt", "a") as f:
            f.write(f"\n--- ERROR at {datetime.now()} ---\n")
            traceback.print_exc(file=f)
        traceback.print_exc()
        raise e


@app.post("/api/check-availability", response_model=AvailabilityResponse)
async def check_appointment_availability(data: AvailabilityRequest):
    try:
        result = check_availability(
            appointment_date=data.appointment_date,
            appointment_time=data.appointment_time
        )
        return result
    except Exception as e:
        with open("error_log.txt", "a") as f:
            f.write(f"\n--- ERROR at {datetime.now()} ---\n")
            traceback.print_exc(file=f)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error checking availability: {str(e)}"
        )


@app.get("/api/appointments")
async def get_appointments():
    result = (
        supabase
        .table("appointments")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data