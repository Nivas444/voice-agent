"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, 
  PhoneCall, 
  Clock, 
  FileText, 
  CheckCircle, 
  X, 
  ArrowRight,
  Info,
  Calendar,
  Phone,
  User,
  Sparkles,
  Play
} from "lucide-react";
import { api } from "@/lib/api";
import { CallLog } from "@/types";

export default function CallLogsPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  useEffect(() => {
    loadCallLogs();
  }, []);

  const loadCallLogs = () => {
    setLoading(true);
    try {
      const data = api.getCallLogs();
      setCallLogs(data);
    } catch (err) {
      console.error("Failed to load call logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering ---
  const filteredLogs = callLogs.filter(log => {
    const matchesSearch = 
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.phone.includes(searchQuery) ||
      log.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex gap-6">
      {/* Main List Area */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Top Header */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Receptionist Call Logs</h2>
          <p className="text-xs text-slate-500 font-medium">Review AI interactions, conversation transcripts, and booking outcomes</p>
        </div>

        {/* Controls */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, or summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:border-violet-600 cursor-pointer"
            >
              <option value="all">All Calls</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Call Log Grid list */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Loading conversation history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
            <PhoneCall className="w-12 h-12 text-slate-300 stroke-1.2 mb-4" />
            <h3 className="font-bold text-slate-800 text-sm">No Calls Registered</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">There are no call records matching the criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              // Outcome styling
              const outcomeColors = {
                Booked: "bg-emerald-50 text-emerald-700 border-emerald-100",
                Inquiry: "bg-amber-50 text-amber-700 border-amber-100",
                Rescheduled: "bg-indigo-50 text-indigo-700 border-indigo-100",
                "No Booking": "bg-slate-50 text-slate-600 border-slate-200"
              };
              const outcomeBadge = outcomeColors[log.outcome] || "bg-slate-50 text-slate-700 border-slate-200";

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedCall(log)}
                  className={`bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group ${
                    selectedCall?.id === log.id ? "ring-2 ring-violet-600/35 border-violet-200" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 border rounded-xl shrink-0 ${
                      log.status === 'completed'
                        ? "bg-slate-50 text-slate-700 border-slate-200 group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    } transition-colors`}>
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-bold text-slate-900 text-sm">{log.name}</h4>
                        <span className="text-xs font-semibold text-slate-400">{log.phone}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl line-clamp-2">
                        {log.summary}
                      </p>
                      <div className="flex flex-wrap gap-4 pt-1.5 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-300" /> {log.time}</span>
                        <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-slate-300" /> Duration: {log.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border rounded-full ${outcomeBadge}`}>
                      {log.outcome}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over Right Drawer Transcript */}
      {selectedCall && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:relative lg:inset-auto lg:bg-transparent lg:backdrop-blur-none lg:z-auto animate-in fade-in duration-200"
          onClick={() => setSelectedCall(null)}
        >
          <aside
            className="w-full max-w-md md:max-w-lg bg-white border-l border-slate-200 h-full lg:h-[calc(100vh-8rem)] flex flex-col shadow-2xl lg:shadow-none fixed right-0 top-0 lg:sticky lg:top-24 z-50 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-violet-600" />
                <h3 className="font-extrabold text-sm text-slate-900">AI Call Transcript</h3>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {/* Metadata Panel Card */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{selectedCall.name}</h4>
                    <p className="text-xs font-semibold text-slate-500">{selectedCall.phone}</p>
                  </div>
                  <span className="p-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg">
                    <User className="w-4 h-4" />
                  </span>
                </div>
                <hr className="border-slate-100" />
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Call Time</p>
                    <p className="text-slate-700 mt-0.5">{selectedCall.time}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Outcome</p>
                    <p className="text-violet-700 mt-0.5">{selectedCall.outcome}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</p>
                    <p className="text-slate-700 mt-0.5">{selectedCall.duration}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Appt Created</p>
                    <p className="text-slate-700 mt-0.5">{selectedCall.appointment_created ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>

              {/* AI Summary Card */}
              <div className="bg-violet-50 border border-violet-100 p-5 rounded-2xl space-y-2 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-violet-500/5 rounded-full"></div>
                <h4 className="font-bold text-violet-800 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> AI Generated Summary
                </h4>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  {selectedCall.summary}
                </p>
              </div>

              {/* Conversation Transcript bubbles */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase">Conversation Thread</h4>
                <div className="space-y-3.5">
                  {selectedCall.transcript.map((msg, idx) => {
                    const isAI = msg.speaker === "AI";
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${isAI ? "mr-auto items-start" : "ml-auto items-end"}`}
                      >
                        <span className="text-[9px] text-slate-400 font-bold uppercase mb-1 px-1">
                          {msg.speaker}
                        </span>
                        <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                          isAI
                            ? "bg-violet-600 text-white rounded-tl-none shadow-md shadow-violet-600/10"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tr-none shadow-sm"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Play recording audio visualizer mock footer */}
            <div className="h-16 border-t border-slate-200 px-6 flex items-center gap-4 bg-white">
              <button className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-full text-slate-700 transition-colors">
                <Play className="w-4 h-4 fill-slate-700" />
              </button>
              <div className="flex-1 flex gap-0.5 items-center">
                {[...Array(24)].map((_, i) => (
                  <span 
                    key={i} 
                    className="w-1 bg-slate-300 rounded-full transition-all"
                    style={{ height: `${Math.max(10, Math.sin(i * 0.5) * 28 + 10)}%` }}
                  ></span>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-500">0:00 / {selectedCall.duration}</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
