from pydantic import BaseModel
from typing import Optional

class Appointment(BaseModel):
    name: str
    phone: str
    appointment_date: str
    appointment_time: str
    service_type: Optional[str] = None

class AvailabilityRequest(BaseModel):
    appointment_date: str
    appointment_time: str

class AvailabilityResponse(BaseModel):
    available: bool
    suggestions: list[str]
