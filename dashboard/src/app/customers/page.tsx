"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, 
  Users, 
  Calendar, 
  PhoneCall, 
  Sparkles, 
  X, 
  FileText,
  User,
  Heart,
  TrendingUp,
  Clock,
  Save,
  Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Drawer tab state
  const [activeTab, setActiveTab] = useState<"history" | "notes">("history");
  
  // Notes edit state
  const [editableNotes, setEditableNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    setLoading(true);
    try {
      const data = api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering ---
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.preferred_service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Select Customer & Open Drawer ---
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setEditableNotes(c.notes);
    setActiveTab("history");
  };

  // --- Save Notes Flow ---
  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setSavingNotes(true);
    try {
      const updated = api.updateCustomerNotes(selectedCustomer.id, editableNotes);
      setSelectedCustomer(updated);
      loadCustomers();
      alert("Notes updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex gap-6">
      {/* Directory Table Area */}
      <div className="flex-1 space-y-6 min-w-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Patient Directory</h2>
          <p className="text-xs text-slate-500 font-medium">Manage patient contact files, booking histories, and customized clinical notes</p>
        </div>

        {/* Search Header */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {/* Directory List Table */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Fetching patient directory...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
            <Users className="w-12 h-12 text-slate-300 stroke-1.2 mb-4" />
            <h3 className="font-bold text-slate-800 text-sm">No Patients Registered</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">There are no patient directories matching the query.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4">Total Appointments</th>
                    <th className="px-6 py-4">Last Visit</th>
                    <th className="px-6 py-4">Preferred Service</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                        selectedCustomer?.id === cust.id ? "bg-violet-50/20" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px]">
                          {cust.name[0]}
                        </div>
                        {cust.name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-500">{cust.phone}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{cust.total_appointments}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{cust.last_appointment}</td>
                      <td className="px-6 py-4">
                        <span className="bg-violet-50 border border-violet-100 text-violet-700 font-bold text-[10px] px-2.5 py-1 rounded-full">
                          {cust.preferred_service}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Profile Details */}
      {selectedCustomer && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:relative lg:inset-auto lg:bg-transparent lg:backdrop-blur-none lg:z-auto animate-in fade-in duration-200"
          onClick={() => setSelectedCustomer(null)}
        >
          <aside
            className="w-full max-w-md bg-white border-l border-slate-200 h-full lg:h-[calc(100vh-8rem)] flex flex-col shadow-2xl lg:shadow-none fixed right-0 top-0 lg:sticky lg:top-24 z-50 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Users className="w-4.5 h-4.5 text-violet-600" />
                <h3 className="font-extrabold text-sm text-slate-900 font-sans">Patient Profile</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Intro Card */}
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-violet-600/10">
                  {selectedCustomer.name[0]}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{selectedCustomer.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedCustomer.phone}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 pb-3 text-center border-b-2 transition-all ${
                    activeTab === "history"
                      ? "border-violet-600 text-violet-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Visit & Call History
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`flex-1 pb-3 text-center border-b-2 transition-all ${
                    activeTab === "notes"
                      ? "border-violet-600 text-violet-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Clinical Notes
                </button>
              </div>
            </div>

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {activeTab === "history" ? (
                <div className="space-y-6">
                  {/* Appointment history list */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Bookings History
                    </h5>
                    <div className="space-y-2.5">
                      {selectedCustomer.appointments_history.map((app) => (
                        <div key={app.id} className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex items-center justify-between text-xs font-semibold">
                          <div>
                            <p className="text-slate-800">{app.service_type}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{app.date} • {app.time}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-md ${
                            app.status === 'confirmed' || app.status === 'completed'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call history list */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5" /> AI Phone Calls
                    </h5>
                    <div className="space-y-2.5">
                      {selectedCustomer.calls_history.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium italic">No calls recorded via AI Receptionist</p>
                      ) : (
                        selectedCustomer.calls_history.map((call) => (
                          <div key={call.id} className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex items-center justify-between text-xs font-semibold">
                            <div>
                              <p className="text-slate-800">Duration: {call.duration}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Called on {call.date}</p>
                            </div>
                            <span className="text-[10px] text-violet-700 font-bold uppercase">{call.outcome}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Notes editing tab */
                <div className="space-y-4 h-full flex flex-col">
                  <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Notes & Preferences</label>
                    <textarea
                      value={editableNotes}
                      onChange={(e) => setEditableNotes(e.target.value)}
                      placeholder="Add medical notes, allergy information, procedure preferences..."
                      className="w-full flex-1 bg-white border border-slate-200 p-4 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 resize-none min-h-[220px]"
                    />
                  </div>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-violet-600/10 flex items-center justify-center gap-2 transition-all"
                  >
                    <Save className="w-4.5 h-4.5" /> {savingNotes ? "Saving Notes..." : "Save Patient Notes"}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
