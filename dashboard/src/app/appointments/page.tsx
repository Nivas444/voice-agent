"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock, 
  MoreVertical,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Sparkles,
  Phone,
  User
} from "lucide-react";
import { api } from "@/lib/api";
import { Appointment } from "@/types";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reschedule Modal State
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    suggestions: string[];
  } | null>(null);

  // New Booking Modal State
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [bookingService, setBookingService] = useState("Root Canal");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00 AM");

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- Filtering & Sorting ---
  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesService = serviceFilter === "all" || app.service_type === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  // Pagination indexing
  const totalItems = filteredAppointments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Reschedule Flow ---
  const openRescheduleModal = (app: Appointment) => {
    setSelectedApp(app);
    setNewDate(app.appointment_date);
    setNewTime(app.appointment_time);
    setAvailabilityResult(null);
    setIsRescheduleOpen(true);
  };

  const handleCheckRescheduleAvailability = async () => {
    if (!newDate || !newTime) return;
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await api.checkAvailability(newDate, newTime);
      setAvailabilityResult(res);
    } catch (err) {
      console.error("Availability check failed:", err);
      alert("Error checking availability.");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedApp) return;
    try {
      await api.rescheduleAppointment(selectedApp.id, newDate, newTime);
      setIsRescheduleOpen(false);
      loadAppointments();
    } catch (err) {
      alert("Error updating schedule: " + err);
    }
  };

  // --- Cancel Flow ---
  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.cancelAppointment(id);
      loadAppointments();
    } catch (err) {
      alert("Error cancelling appointment: " + err);
    }
  };

  // --- New Booking Flow ---
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !bookingDate || !bookingTime) {
      alert("Please fill in all fields.");
      return;
    }
    
    // First check availability
    setCheckingAvailability(true);
    try {
      const avail = await api.checkAvailability(bookingDate, bookingTime);
      if (!avail.available) {
        alert(`This slot is occupied! suggestions: ${avail.suggestions.join(", ")}`);
        setCheckingAvailability(false);
        return;
      }
      
      await api.createAppointment({
        name: newName,
        phone: newPhone,
        appointment_date: bookingDate,
        appointment_time: bookingTime,
        service_type: bookingService
      });

      // Reset
      setNewName("");
      setNewPhone("");
      setBookingDate("");
      setIsNewBookingOpen(false);
      loadAppointments();
    } catch (err) {
      alert("Error creating booking: " + err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Extract unique services for dropdown filters
  const uniqueServices = Array.from(
    new Set(appointments.map(a => a.service_type).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Manage Appointments</h2>
          <p className="text-xs text-slate-500 font-medium">Verify slots, reschedule, or cancel patient bookings</p>
        </div>
        <button 
          onClick={() => setIsNewBookingOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-violet-600/20 flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Service:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 cursor-pointer"
            >
              <option value="all">All Services</option>
              {uniqueServices.map(srv => (
                <option key={srv} value={srv || ""}>{srv}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Fetching patient bookings...</p>
        </div>
      ) : paginatedAppointments.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
          <Calendar className="w-12 h-12 text-slate-300 stroke-1.2 mb-4" />
          <h3 className="font-bold text-slate-800 text-sm">No Appointments Found</h3>
          <p className="text-xs text-slate-500 font-medium mt-1 max-w-[280px]">
            No appointments match your search query or filters. Check back or book a new slot.
          </p>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">Appt Date</th>
                  <th className="px-6 py-4">Appt Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedAppointments.map((app) => {
                  // Status badge helper
                  const statusColors = {
                    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
                    completed: "bg-sky-50 text-sky-700 border-sky-200"
                  };
                  const statusBadge = statusColors[app.status] || "bg-slate-50 text-slate-700 border-slate-200";

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{app.name}</td>
                      <td className="px-6 py-4 font-semibold text-slate-500">{app.phone}</td>
                      <td className="px-6 py-4 font-bold text-violet-700">{app.service_type || "General Clinic"}</td>
                      <td className="px-6 py-4">{app.appointment_date}</td>
                      <td className="px-6 py-4 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {app.appointment_time}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-full ${statusBadge}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openRescheduleModal(app)}
                            className="text-violet-600 hover:text-white p-1.5 hover:bg-violet-600 rounded-lg transition-colors border border-violet-100 hover:border-violet-600"
                            title="Reschedule"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          {app.status !== 'cancelled' && (
                            <button 
                              onClick={() => handleCancelAppointment(app.id)}
                              className="text-rose-600 hover:text-white p-1.5 hover:bg-rose-600 rounded-lg transition-colors border border-rose-100 hover:border-rose-600"
                              title="Cancel Appointment"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/30">
              <span className="text-slate-400 font-semibold">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => Math.max(c - 1, 1))}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900">Reschedule Appointment</h3>
              <button onClick={() => setIsRescheduleOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-violet-50/50 p-4 border border-violet-100 rounded-xl space-y-1">
                <p className="text-xs text-violet-700 font-bold uppercase tracking-wider">Rescheduling for</p>
                <p className="text-sm font-extrabold text-slate-900">{selectedApp.name}</p>
                <p className="text-xs font-semibold text-slate-500">{selectedApp.service_type} • {selectedApp.phone}</p>
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setAvailabilityResult(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              {/* Time Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Time</label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM"
                  value={newTime}
                  onChange={(e) => {
                    setNewTime(e.target.value);
                    setAvailabilityResult(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              {/* Availability check feedback block */}
              {availabilityResult && (
                <div className={`p-4 border rounded-xl space-y-2 text-xs font-semibold ${
                  availabilityResult.available 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : "bg-amber-50 border-amber-100 text-amber-800"
                }`}>
                  <div className="flex items-center gap-2">
                    {availabilityResult.available ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <span>{availabilityResult.available ? "Slot is available!" : "Slot is already occupied!"}</span>
                  </div>

                  {!availabilityResult.available && availabilityResult.suggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">Suggested alternative times:</p>
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

              {/* Check Availability Trigger */}
              {!availabilityResult && (
                <button
                  onClick={handleCheckRescheduleAvailability}
                  disabled={checkingAvailability || !newDate || !newTime}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {checkingAvailability ? "Checking Google Calendar..." : "Verify Slot Availability"}
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="h-16 border-t border-slate-200 bg-slate-50 px-6 flex items-center justify-end gap-2.5">
              <button 
                onClick={() => setIsRescheduleOpen(false)} 
                className="bg-white border border-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                Close
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!availabilityResult?.available}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-violet-600/10 transition-all disabled:opacity-50"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateBooking}
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900">Book New Appointment</h3>
              <button type="button" onClick={() => setIsNewBookingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="Aarav Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98300 12345"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Type</label>
                <select
                  value={bookingService}
                  onChange={(e) => setBookingService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="Root Canal">Root Canal</option>
                  <option value="Scaling & Polishing">Scaling & Polishing</option>
                  <option value="Routine Checkup">Routine Checkup</option>
                  <option value="Orthodontics">Orthodontics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
            </div>

            <div className="h-16 border-t border-slate-200 bg-slate-50 px-6 flex items-center justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => setIsNewBookingOpen(false)} 
                className="bg-white border border-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={checkingAvailability}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-violet-600/10 transition-all"
              >
                {checkingAvailability ? "Booking..." : "Book Slot"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
