import { CallLog, Customer, Appointment, ClinicSettings } from '../types';

export const INITIAL_SETTINGS: ClinicSettings = {
  clinic_name: "ABC Dental Clinic",
  address: "102 Health & Science Square, Sector 4, Kolkata",
  phone: "+91 98765 43210",
  open_time: "09:00 AM",
  close_time: "06:00 PM",
  slot_duration: 30,
  buffer_time: 5,
  greeting_message: "Hello! Thank you for calling ABC Dental Clinic. I am your AI receptionist. How can I help you book or manage your appointment today?",
  voice: "en-US-Neural-F-Soft",
  language: "en-US"
};

export const MOCK_CALL_LOGS: CallLog[] = [
  {
    id: "call-1",
    name: "Aarav Sharma",
    phone: "+91 98300 12345",
    duration: "2m 15s",
    time: "Today, 10:15 AM",
    status: "completed",
    summary: "Customer called to book an appointment for acute toothache. AI agent checked availability and booked a Root Canal consultation for 19 June 2026 at 10:00 AM.",
    outcome: "Booked",
    appointment_created: true,
    transcript: [
      { speaker: "AI", text: "Hello! Thank you for calling ABC Dental Clinic. I am your AI receptionist. How can I help you today?" },
      { speaker: "Customer", text: "Hi, I have a really bad toothache on my lower right side. I need to see a doctor as soon as possible." },
      { speaker: "AI", text: "I'm sorry to hear you're in pain. Let's get that looked at. I can book you in for a Root Canal consultation. Would tomorrow, 19 June 2026, work for you?" },
      { speaker: "Customer", text: "Yes, tomorrow is good. Do you have anything in the morning?" },
      { speaker: "AI", text: "Let me check our schedules. Yes, we have a slot open at 10:00 AM. Does that work?" },
      { speaker: "Customer", text: "Perfect. Book me for 10:00 AM tomorrow." },
      { speaker: "AI", text: "Great! I have reserved that slot for you. Could you please confirm your full name?" },
      { speaker: "Customer", text: "My name is Aarav Sharma." },
      { speaker: "AI", text: "Thank you, Aarav. Your appointment is booked for 19 June 2026 at 10:00 AM. We look forward to seeing you. Take care!" },
      { speaker: "Customer", text: "Thank you so much. Goodbye." }
    ]
  },
  {
    id: "call-2",
    name: "Riya Sen",
    phone: "+91 98744 55667",
    duration: "1m 10s",
    time: "Today, 11:30 AM",
    status: "completed",
    summary: "Customer called to inquire about teeth whitening service rates and clinic timings. No booking made.",
    outcome: "Inquiry",
    appointment_created: false,
    transcript: [
      { speaker: "AI", text: "Hello! Thank you for calling ABC Dental Clinic. How can I assist you today?" },
      { speaker: "Customer", text: "Hi, I wanted to know if you offer laser teeth whitening and how much it costs." },
      { speaker: "AI", text: "Yes, we offer professional laser teeth whitening. The cost ranges between ₹6,000 to ₹10,000 depending on the current staining. Would you like to schedule a consultation?" },
      { speaker: "Customer", text: "I see. I'll need to check my calendar and call back. What are your opening hours?" },
      { speaker: "AI", text: "We are open Monday through Saturday from 9:00 AM to 6:00 PM." },
      { speaker: "Customer", text: "Okay, perfect. Thank you for the information." },
      { speaker: "AI", text: "You're welcome! Have a great day ahead." }
    ]
  },
  {
    id: "call-3",
    name: "Vikram Malhotra",
    phone: "+91 90070 88990",
    duration: "1m 45s",
    time: "Yesterday, 3:20 PM",
    status: "completed",
    summary: "Customer called to reschedule their checkup because of a conflict. AI agent successfully checked slots and rescheduled from 18 June to 20 June 2026 at 11:00 AM.",
    outcome: "Rescheduled",
    appointment_created: true,
    transcript: [
      { speaker: "AI", text: "Hello! Thank you for calling ABC Dental Clinic. How can I help you today?" },
      { speaker: "Customer", text: "Hi, I have an appointment booked for today at 4 PM, but I got stuck at work. Can I move it to Saturday?" },
      { speaker: "AI", text: "Sure, let's look at Saturday, 20 June 2026. What time would you prefer?" },
      { speaker: "Customer", text: "Do you have anything around 11:00 AM?" },
      { speaker: "AI", text: "Checking availability... Yes! 11:00 AM on Saturday is available. I will reschedule your dental checkup to 20 June 2026 at 11:00 AM." },
      { speaker: "Customer", text: "Awesome, thank you. You guys are very efficient." },
      { speaker: "AI", text: "You're very welcome, Vikram. Your schedule is updated. See you on Saturday!" }
    ]
  },
  {
    id: "call-4",
    name: "Unknown Caller",
    phone: "+91 91234 56789",
    duration: "0m 18s",
    time: "Yesterday, 5:45 PM",
    status: "missed",
    summary: "Caller hung up immediately after greeting. No conversation took place.",
    outcome: "No Booking",
    appointment_created: false,
    transcript: [
      { speaker: "AI", text: "Hello! Thank you for calling ABC Dental Clinic..." },
      { speaker: "Customer", text: "[Call Ended]" }
    ]
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Aarav Sharma",
    phone: "+91 98300 12345",
    total_appointments: 3,
    last_appointment: "19 June 2026",
    preferred_service: "Root Canal",
    notes: "Patient experiences mild anxiety during procedures. Needs extra local anesthetic. Prefers morning appointments.",
    appointments_history: [
      { id: "app-101", date: "19 June 2026", time: "10:00 AM", service_type: "Root Canal", status: "confirmed" },
      { id: "app-102", date: "05 January 2026", time: "11:30 AM", service_type: "Scaling & Polishing", status: "completed" },
      { id: "app-103", date: "12 July 2025", time: "02:00 PM", service_type: "Consultation", status: "completed" }
    ],
    calls_history: [
      { id: "call-1", date: "18 June 2026", duration: "2m 15s", outcome: "Booked" },
      { id: "call-c10", date: "04 January 2026", duration: "1m 45s", outcome: "Booked" }
    ]
  },
  {
    id: "cust-2",
    name: "Riya Sen",
    phone: "+91 98744 55667",
    total_appointments: 1,
    last_appointment: "15 April 2026",
    preferred_service: "Consultation",
    notes: "Interested in cosmetic dentistry. Shared prices for teeth whitening on 18 June 2026.",
    appointments_history: [
      { id: "app-104", date: "15 April 2026", time: "04:30 PM", service_type: "Consultation", status: "completed" }
    ],
    calls_history: [
      { id: "call-2", date: "18 June 2026", duration: "1m 10s", outcome: "Inquiry" }
    ]
  },
  {
    id: "cust-3",
    name: "Vikram Malhotra",
    phone: "+91 90070 88990",
    total_appointments: 5,
    last_appointment: "20 June 2026",
    preferred_service: "Routine Checkup",
    notes: "Long time client. Has mild gingivitis, advised flossing twice daily. Usually reschedules due to corporate travel.",
    appointments_history: [
      { id: "app-105", date: "20 June 2026", time: "11:00 AM", service_type: "Routine Checkup", status: "confirmed" },
      { id: "app-106", date: "15 December 2025", time: "09:00 AM", service_type: "Routine Checkup", status: "completed" },
      { id: "app-107", date: "10 June 2025", time: "10:30 AM", service_type: "Scaling & Polishing", status: "completed" }
    ],
    calls_history: [
      { id: "call-3", date: "18 June 2026", duration: "1m 45s", outcome: "Rescheduled" },
      { id: "call-c15", date: "14 December 2025", duration: "1m 20s", outcome: "Booked" }
    ]
  }
];

export const MOCK_APPOINTMENTS_TREND = [
  { name: "Mon", appointments: 4 },
  { name: "Tue", appointments: 6 },
  { name: "Wed", appointments: 8 },
  { name: "Thu", appointments: 5 },
  { name: "Fri", appointments: 9 },
  { name: "Sat", appointments: 12 },
  { name: "Sun", appointments: 2 }
];

export const MOCK_DAILY_CALLS = [
  { name: "09:00", calls: 8 },
  { name: "11:00", calls: 14 },
  { name: "13:00", calls: 5 },
  { name: "15:00", calls: 12 },
  { name: "17:00", calls: 9 }
];

export const MOCK_SERVICE_DISTRIBUTION = [
  { name: "Root Canal", value: 35, color: "#8b5cf6" },
  { name: "Scaling & Polishing", value: 25, color: "#a78bfa" },
  { name: "Routine Checkup", value: 30, color: "#c084fc" },
  { name: "Orthodontics", value: 10, color: "#ddd6fe" }
];
