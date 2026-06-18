from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from datetime import datetime, timedelta, timezone
import os
from dateutil import parser

SCOPES = ["https://www.googleapis.com/auth/calendar"]

def get_calendar_service():
    creds = None

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file(
            "token.json",
            SCOPES
        )

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json",
                SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    service = build(
        "calendar",
        "v3",
        credentials=creds
    )

    return service

def create_calendar_event(
    customer_name,
    appointment_date,
    appointment_time
):
    service = get_calendar_service()

    try:
        combined_str = f"{appointment_date} {appointment_time}"
        start_dt = parser.parse(combined_str, dayfirst=True)
    except Exception as e:
        raise ValueError(f"Could not parse date/time: '{appointment_date} {appointment_time}' - Error: {e}")

    # Appointment duration = 30 minutes
    end_dt = start_dt + timedelta(minutes=30)

    event = {
        "summary": f"Dental Appointment - {customer_name}",
        "description": "Booked via AI Receptionist",
        "start": {
            "dateTime": start_dt.isoformat(),
            "timeZone": "Asia/Kolkata"
        },
        "end": {
            "dateTime": end_dt.isoformat(),
            "timeZone": "Asia/Kolkata"
        }
    }

    created_event = (
        service.events()
        .insert(
            calendarId="primary",
            body=event
        )
        .execute()
    )

    return created_event

def check_availability(
    appointment_date: str,
    appointment_time: str
) -> dict:
    service = get_calendar_service()
    kolkata_tz = timezone(timedelta(hours=5, minutes=30))

    try:
        combined_str = f"{appointment_date} {appointment_time}"
        start_dt = parser.parse(combined_str, dayfirst=True)
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=kolkata_tz)
        else:
            start_dt = start_dt.astimezone(kolkata_tz)
    except Exception as e:
        raise ValueError(f"Could not parse date/time: '{appointment_date} {appointment_time}' - Error: {e}")

    end_dt = start_dt + timedelta(minutes=30)

    # Fetch events for the next 24 hours to find suggestions
    window_start = start_dt
    window_end = start_dt + timedelta(hours=24)

    events_result = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=window_start.isoformat(),
            timeMax=window_end.isoformat(),
            singleEvents=True,
            orderBy="startTime"
        )
        .execute()
    )
    events_list = events_result.get("items", [])

    # Helper function to check if a candidate slot overlaps with any calendar events
    def is_slot_available(slot_start, slot_end):
        for event in events_list:
            if event.get("transparency") == "transparent":
                continue
            if event.get("status") == "cancelled":
                continue

            start_raw = event.get("start", {}).get("dateTime") or event.get("start", {}).get("date")
            end_raw = event.get("end", {}).get("dateTime") or event.get("end", {}).get("date")

            if not start_raw or not end_raw:
                continue

            event_start = parser.parse(start_raw)
            event_end = parser.parse(end_raw)

            if event_start.tzinfo is None:
                event_start = event_start.replace(tzinfo=kolkata_tz)
            else:
                event_start = event_start.astimezone(kolkata_tz)

            if event_end.tzinfo is None:
                event_end = event_end.replace(tzinfo=kolkata_tz)
            else:
                event_end = event_end.astimezone(kolkata_tz)

            # Check overlap: event_start < slot_end AND event_end > slot_start
            if event_start < slot_end and event_end > slot_start:
                return False
        return True

    # Check the requested slot
    requested_available = is_slot_available(start_dt, end_dt)

    if requested_available:
        return {
            "available": True,
            "suggestions": []
        }

    # If unavailable, search for the next 3 available 30-minute slots
    suggestions = []
    candidate_start = start_dt
    
    while len(suggestions) < 3:
        candidate_start += timedelta(minutes=30)
        candidate_end = candidate_start + timedelta(minutes=30)

        # Safety boundary check
        if candidate_end > window_end:
            break

        if is_slot_available(candidate_start, candidate_end):
            formatted_time = candidate_start.strftime("%I:%M %p").lstrip("0")
            suggestions.append(formatted_time)

    return {
        "available": False,
        "suggestions": suggestions
    }
