export interface Appointment {
  id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string | null;
  created_at?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  calendar_event_id?: string | null;
}

export interface CallLog {
  id: string;
  name: string;
  phone: string;
  duration: string; // e.g. "2m 14s"
  time: string; // e.g. "10:30 AM" or ISO string
  status: 'completed' | 'missed' | 'failed';
  summary: string;
  transcript: { speaker: 'AI' | 'Customer'; text: string }[];
  outcome: 'Booked' | 'Inquiry' | 'Rescheduled' | 'No Booking';
  appointment_created: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  total_appointments: number;
  last_appointment: string;
  preferred_service: string;
  notes: string;
  appointments_history: {
    id: string;
    date: string;
    time: string;
    service_type: string;
    status: string;
  }[];
  calls_history: {
    id: string;
    date: string;
    duration: string;
    outcome: string;
  }[];
}

export interface ClinicSettings {
  clinic_name: string;
  address: string;
  phone: string;
  open_time: string;
  close_time: string;
  slot_duration: number; // in minutes
  buffer_time: number; // in minutes
  greeting_message: string;
  voice: string;
  language: string;
}

export interface AvailabilityRequest {
  appointment_date: string;
  appointment_time: string;
}

export interface AvailabilityResponse {
  available: boolean;
  suggestions: string[];
}
