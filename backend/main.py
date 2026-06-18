import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import traceback
from datetime import datetime, timezone, timedelta
from dateutil import parser

# Add the backend directory to sys.path to resolve imports on Render
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import supabase
from models import (
    Appointment, 
    AvailabilityRequest, 
    AvailabilityResponse,
    CancelAppointmentRequest,
    RescheduleAppointmentRequest,
    GetAppointmentDetailsRequest
)
from calendar_service import (
    create_calendar_event, 
    check_availability,
    delete_calendar_event,
    update_calendar_event
)

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
            "service_type": data.service_type,
            "status": "confirmed"
        }

        result = (
            supabase
            .table("appointments")
            .insert(appointment)
            .execute()
        )

        calendar_event_id = None
        try:
            calendar = create_calendar_event(
                customer_name=data.name,
                appointment_date=data.appointment_date,
                appointment_time=data.appointment_time
            )
            calendar_event_id = calendar.get("id")
        except Exception as calendar_err:
            print(f"Error creating calendar event: {calendar_err}")
            # Even if calendar fails, we continue but print/log the error

        if calendar_event_id and result.data and len(result.data) > 0:
            inserted_id = result.data[0]["id"]
            supabase.table("appointments").update({
                "calendar_event_id": calendar_event_id
            }).eq("id", inserted_id).execute()
            result.data[0]["calendar_event_id"] = calendar_event_id

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


@app.post("/api/cancel-appointment")
async def cancel_appointment(data: CancelAppointmentRequest):
    try:
        # 1. Fetch all confirmed appointments for the phone number, sorted by created_at desc
        result = (
            supabase
            .table("appointments")
            .select("*")
            .eq("phone", data.phone)
            .eq("status", "confirmed")
            .order("created_at", desc=True)
            .execute()
        )
        
        appointments = result.data or []
        upcoming_appt = None
        
        # Determine current local time in Asia/Kolkata
        kolkata_tz = timezone(timedelta(hours=5, minutes=30))
        now = datetime.now(kolkata_tz)
        
        for appt in appointments:
            try:
                combined_str = f"{appt['appointment_date']} {appt['appointment_time']}"
                appt_dt = parser.parse(combined_str, dayfirst=True)
                if appt_dt.tzinfo is None:
                    appt_dt = appt_dt.replace(tzinfo=kolkata_tz)
                else:
                    appt_dt = appt_dt.astimezone(kolkata_tz)
                
                if appt_dt >= now:
                    upcoming_appt = appt
                    break
            except Exception:
                continue
        
        if not upcoming_appt:
            raise HTTPException(
                status_code=404,
                detail="No active upcoming appointment found for this phone number"
            )
            
        calendar_event_id = upcoming_appt.get("calendar_event_id")
        
        # 2. Delete corresponding Google Calendar event (if calendar_event_id exists)
        if calendar_event_id:
            try:
                delete_calendar_event(calendar_event_id)
            except Exception as cal_err:
                print(f"Error during Google Calendar event deletion: {cal_err}")
                # Log error and continue to update Supabase database status (graceful handling)
                
        # 3. Update appointment status to 'cancelled' and store cancelled_at
        now_utc = datetime.now(timezone.utc).isoformat()
        try:
            supabase.table("appointments").update({
                "status": "cancelled",
                "cancelled_at": now_utc
            }).eq("id", upcoming_appt["id"]).execute()
        except Exception as db_err:
            if "cancelled_at" in str(db_err):
                print("cancelled_at column not found in appointments schema, falling back to updating status only...")
                supabase.table("appointments").update({
                    "status": "cancelled"
                }).eq("id", upcoming_appt["id"]).execute()
            else:
                raise db_err

        
        return {
            "success": True,
            "message": "Appointment cancelled successfully"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        with open("error_log.txt", "a") as f:
            f.write(f"\n--- ERROR at {datetime.now()} ---\n")
            traceback.print_exc(file=f)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error cancelling appointment: {str(e)}"
        )


@app.post("/api/reschedule-appointment")
async def reschedule_appointment(data: RescheduleAppointmentRequest):
    try:
        # 1. Find the latest active (confirmed) appointment using phone number
        result = (
            supabase
            .table("appointments")
            .select("*")
            .eq("phone", data.phone)
            .eq("status", "confirmed")
            .order("created_at", desc=True)
            .execute()
        )
        
        appointments = result.data or []
        if not appointments:
            raise HTTPException(
                status_code=404,
                detail="No active appointment found for this phone number"
            )
            
        # We target the most recently created confirmed appointment
        target_appt = appointments[0]
        calendar_event_id = target_appt.get("calendar_event_id")
        
        # 2. Check availability using existing check_availability logic,
        # but exclude the target_appt's current calendar event to avoid false conflict with itself.
        availability = check_availability(
            appointment_date=data.new_date,
            appointment_time=data.new_time,
            exclude_event_id=calendar_event_id
        )
        
        # If the slot is unavailable: return suggestions
        if not availability.get("available"):
            return {
                "success": False,
                "message": "Requested slot unavailable",
                "suggestions": availability.get("suggestions", [])
            }
            
        # If available: update Google Calendar event
        updated_event_id = calendar_event_id
        if calendar_event_id:
            try:
                updated_event = update_calendar_event(
                    event_id=calendar_event_id,
                    new_date=data.new_date,
                    new_time=data.new_time,
                    customer_name=target_appt.get("name", "Customer")
                )
                if updated_event:
                    updated_event_id = updated_event.get("id", calendar_event_id)
            except Exception as cal_err:
                print(f"Error rescheduling Google Calendar event: {cal_err}")
                # Gracefully proceed, maybe recreate it if it didn't exist
                
        # Update Supabase appointment date, time, and calendar_event_id
        supabase.table("appointments").update({
            "appointment_date": data.new_date,
            "appointment_time": data.new_time,
            "calendar_event_id": updated_event_id
        }).eq("id", target_appt["id"]).execute()
        
        return {
            "success": True,
            "message": "Appointment rescheduled successfully"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        with open("error_log.txt", "a") as f:
            f.write(f"\n--- ERROR at {datetime.now()} ---\n")
            traceback.print_exc(file=f)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error rescheduling appointment: {str(e)}"
        )


@app.post("/api/get-appointment-details")
async def get_appointment_details(data: GetAppointmentDetailsRequest):
    try:
        # Search latest active (confirmed) appointment by phone number
        result = (
            supabase
            .table("appointments")
            .select("*")
            .eq("phone", data.phone)
            .eq("status", "confirmed")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        
        appointments = result.data or []
        if not appointments:
            raise HTTPException(
                status_code=404,
                detail="No active appointment found for this phone number"
            )
            
        appt = appointments[0]
        return {
            "success": True,
            "appointment": {
                "name": appt.get("name"),
                "phone": appt.get("phone"),
                "service_type": appt.get("service_type"),
                "appointment_date": appt.get("appointment_date"),
                "appointment_time": appt.get("appointment_time"),
                "status": appt.get("status")
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        with open("error_log.txt", "a") as f:
            f.write(f"\n--- ERROR at {datetime.now()} ---\n")
            traceback.print_exc(file=f)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error getting appointment details: {str(e)}"
        )