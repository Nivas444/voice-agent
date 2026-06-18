"use client";

import React, { useEffect, useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Phone, 
  XCircle,
  Calendar,
  X,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { Appointment } from "@/types";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 18)); // Mock active date: June 18, 2026
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  
  // Reschedule state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    suggestions: string[];
  } | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments for calendar:", err);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper calculations for calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Weekday index for day 1

  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const calendarCells: { day: number; dateString: string; isCurrentMonth: boolean }[] = [];

  // 1. Add days from previous month to fill the first row
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonthDate = new Date(year, month - 1, d);
    const dateString = formatDateString(prevMonthDate);
    calendarCells.push({ day: d, dateString, isCurrentMonth: false });
  }

  // 2. Add current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateString = formatDateString(curDate);
    calendarCells.push({ day: d, dateString, isCurrentMonth: true });
  }

  // 3. Fill the remaining spots of the 6-row grid (42 cells total)
  const remainingCells = 42 - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const dateString = formatDateString(nextMonthDate);
    calendarCells.push({ day: d, dateString, isCurrentMonth: false });
  }

  // Helper to format date object to YYYY-MM-DD
  function formatDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Reschedule Trigger
  const startReschedule = () => {
    if (!selectedApp) return;
    setNewDate(selectedApp.appointment_date);
    setNewTime(selectedApp.appointment_time);
    setAvailabilityResult(null);
    setIsRescheduleOpen(true);
  };

  const handleCheckAvailability = async () => {
    if (!newDate || !newTime) return;
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await api.checkAvailability(newDate, newTime);
      setAvailabilityResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedApp) return;
    try {
      await api.rescheduleAppointment(selectedApp.id, newDate, newTime);
      setIsRescheduleOpen(false);
      setSelectedApp(null);
      loadAppointments();
    } catch (err) {
      alert("Error: " + err);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedApp) return;
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.cancelAppointment(selectedApp.id);
      setSelectedApp(null);
      loadAppointments();
    } catch (err) {
      alert("Error: " + err);
    }
  };

  const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Clinic Calendar</h2>
          <p className="text-xs text-slate-500 font-medium">Google Calendar sync view showing confirmed bookings</p>
        </div>
        <div className="flex items-center gap-3.5 bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
          <button 
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm text-slate-800 min-w-[120px] text-center uppercase tracking-wide">
            {monthName} {year}
          </span>
          <button 
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Weekdays */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/75">
          {weekdayHeaders.map((day) => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-100 min-h-[560px]">
          {calendarCells.map((cell, idx) => {
            // Get appointments matching this cell date
            const dayAppointments = appointments.filter(
              (app) => app.appointment_date === cell.dateString
            );

            return (
              <div 
                key={idx} 
                className={`p-2 flex flex-col gap-1 min-h-[90px] ${
                  cell.isCurrentMonth ? "bg-white" : "bg-slate-50/40 text-slate-400"
                }`}
              >
                <span className={`text-[10px] font-bold self-start w-5 h-5 flex items-center justify-center rounded-full ${
                  cell.dateString === "2026-06-18"
                    ? "bg-violet-600 text-white shadow shadow-violet-600/20"
                    : "text-slate-700 font-semibold"
                }`}>
                  {cell.day}
                </span>

                {/* Event Chips List */}
                <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-none">
                  {dayAppointments.map((app) => {
                    const statusColors = {
                      confirmed: "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100/70",
                      pending: "bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100/70",
                      cancelled: "bg-rose-50/50 text-rose-500 border-rose-100 line-through",
                      completed: "bg-sky-50 text-sky-800 border-sky-100 hover:bg-sky-100/70"
                    };
                    const chipStyle = statusColors[app.status] || "bg-slate-50 text-slate-700";

                    return (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`w-full text-left truncate text-[10px] font-bold px-2 py-1 rounded border text-ellipsis transition-all ${chipStyle}`}
                      >
                        {app.appointment_time} {app.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment Detail Dialog */}
      {selectedApp && !isRescheduleOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900">Appointment Details</h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs font-semibold">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-100">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{selectedApp.name}</h4>
                  <p className="text-xs text-slate-500">{selectedApp.phone}</p>
                </div>
              </div>
              <hr className="border-slate-100" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Service Type</p>
                  <p className="text-slate-800 mt-0.5">{selectedApp.service_type || "General Clinic"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Status</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-bold uppercase text-[9px]">
                    {selectedApp.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Appt Date</p>
                  <p className="text-slate-800 mt-0.5">{selectedApp.appointment_date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Appt Time</p>
                  <p className="text-slate-800 mt-0.5">{selectedApp.appointment_time}</p>
                </div>
              </div>
            </div>

            <div className="h-16 border-t border-slate-200 bg-slate-50 px-6 flex items-center justify-between">
              {selectedApp.status !== 'cancelled' ? (
                <button
                  onClick={handleCancelAppointment}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1"
                >
                  Cancel Appt
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="bg-white border border-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-100 transition-all"
                >
                  Close
                </button>
                {selectedApp.status !== 'cancelled' && (
                  <button
                    onClick={startReschedule}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-violet-600/10 transition-all"
                  >
                    Reschedule
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Confirmation Modal */}
      {isRescheduleOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900">Reschedule Appointment</h3>
              <button 
                onClick={() => {
                  setIsRescheduleOpen(false);
                  setSelectedApp(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setAvailabilityResult(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select New Time</label>
                <input
                  type="text"
                  placeholder="e.g., 10:00 AM"
                  value={newTime}
                  onChange={(e) => {
                    setNewTime(e.target.value);
                    setAvailabilityResult(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Check result */}
              {availabilityResult && (
                <div className={`p-4 border rounded-xl space-y-2 text-xs font-semibold ${
                  availabilityResult.available 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : "bg-amber-50 border-amber-100 text-amber-800"
                }`}>
                  <div className="flex items-center gap-2">
                    {availabilityResult.available ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <span>{availabilityResult.available ? "Slot is available!" : "Slot is occupied!"}</span>
                  </div>

                  {!availabilityResult.available && availabilityResult.suggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">Alternative times:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {availabilityResult.suggestions.map(sug => (
                          <button
                            key={sug}
                            onClick={() => {
                              setNewTime(sug);
                              setAvailabilityResult(null);
                            }}
                            className="bg-white hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold px-2 py-1 rounded-md text-[10px] transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!availabilityResult && (
                <button
                  onClick={handleCheckAvailability}
                  disabled={checkingAvailability || !newDate || !newTime}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs py-2.5 rounded-xl disabled:opacity-50"
                >
                  {checkingAvailability ? "Verifying Google Calendar..." : "Verify Slot Availability"}
                </button>
              )}
            </div>

            <div className="h-16 border-t border-slate-200 bg-slate-50 px-6 flex items-center justify-end gap-2.5">
              <button 
                onClick={() => {
                  setIsRescheduleOpen(false);
                  setSelectedApp(null);
                }} 
                className="bg-white border border-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                Close
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!availabilityResult?.available}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl disabled:opacity-50"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
