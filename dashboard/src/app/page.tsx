"use client";

import React, { useEffect, useState } from "react";
import { 
  Calendar, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  UserPlus, 
  FileText,
  CalendarCheck,
  ChevronRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { api } from "@/lib/api";
import { Appointment, CallLog } from "@/types";
import { 
  MOCK_APPOINTMENTS_TREND, 
  MOCK_DAILY_CALLS, 
  MOCK_SERVICE_DISTRIBUTION 
} from "@/lib/mockData";
import Link from "next/link";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const apps = await api.getAppointments();
        setAppointments(apps);
        const calls = api.getCallLogs();
        setCallLogs(calls);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- Calculations ---
  const totalAppointments = appointments.length;
  
  // Format today's date to match API strings (e.g. 2026-06-18)
  const todayStr = "2026-06-18"; // Matching simulation local date
  const todaysAppointmentsList = appointments.filter(
    app => app.appointment_date === todayStr && app.status !== 'cancelled'
  );
  const todaysAppointmentsCount = todaysAppointmentsList.length;
  
  const totalCalls = callLogs.length;
  
  // Booking success rate = calls with outcome 'Booked' / total calls
  const bookedCalls = callLogs.filter(c => c.outcome === 'Booked').length;
  const successRate = totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0;

  // Upcoming appointments
  const upcomingAppointments = appointments
    .filter(app => app.status === 'confirmed' || app.status === 'pending')
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 4);

  // Recent Activity Panel Feed
  const recentActivities = [
    {
      id: "act-1",
      type: "booking",
      user: "Aarav Sharma",
      detail: "booked Root Canal consultation for 19 June 2026 at 10:00 AM",
      time: "10m ago",
      icon: UserPlus,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      id: "act-2",
      type: "reschedule",
      user: "Vikram Malhotra",
      detail: "rescheduled Dental Checkup to 20 June 2026 at 11:00 AM",
      time: "1h ago",
      icon: CalendarCheck,
      color: "bg-violet-50 text-violet-600 border-violet-100"
    },
    {
      id: "act-3",
      type: "cancellation",
      user: "Rahul Verma",
      detail: "cancelled scaling appointment due to travel scheduling conflict",
      time: "Yesterday",
      icon: XCircleComponent,
      color: "bg-rose-50 text-rose-600 border-rose-100"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-white border border-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-white border border-slate-200 rounded-2xl lg:col-span-2"></div>
          <div className="h-96 bg-white border border-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Appointments</span>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalAppointments}</h3>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 border border-violet-100 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.4%</span>
            <span className="text-slate-400 font-medium">from last month</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Bookings</span>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{todaysAppointmentsCount}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span>{todaysAppointmentsList.filter(a => a.status === 'confirmed').length} Confirmed</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600">{todaysAppointmentsList.filter(a => a.status === 'pending').length} Pending</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Voice Calls</span>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCalls}</h3>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
              <PhoneCall className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Avg duration: 1m 32s</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking Success Rate</span>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{successRate}%</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+4.2%</span>
            <span className="text-slate-400 font-medium">improvement</span>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Trend Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Appointments Trend</h3>
              <p className="text-xs text-slate-500 font-medium">Weekly analysis of scheduled patients</p>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_APPOINTMENTS_TREND}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="appointments" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Call Volume Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-[400px]">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Hourly Call Traffic</h3>
            <p className="text-xs text-slate-500 font-medium">Total incoming phone volume today</p>
          </div>
          <div className="flex-1 min-h-0 mt-6 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DAILY_CALLS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="calls" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Grid: Lower Activity Feed & Upcoming */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Distribution Pie Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-[380px]">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Service Distribution</h3>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4 min-h-0">
            <div className="w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_SERVICE_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {MOCK_SERVICE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {MOCK_SERVICE_DISTRIBUTION.map((service, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: service.color }}></span>
                  <span className="text-xs font-semibold text-slate-700">{service.name}</span>
                  <span className="text-xs text-slate-400 font-medium">({service.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments Widget */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Upcoming Bookings</h3>
            <Link href="/appointments" className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-0.5">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {upcomingAppointments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8">
                <Calendar className="w-10 h-10 stroke-1.5 mb-2" />
                <p className="text-xs font-medium">No upcoming appointments</p>
              </div>
            ) : (
              upcomingAppointments.map((app) => (
                <div key={app.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-800">{app.name}</p>
                    <p className="text-xs font-medium text-slate-500">{app.service_type || "General Dental"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-700">
                      {new Date(app.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">{app.appointment_time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Panel */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-[380px]">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex gap-3 items-start">
                  <div className={`p-2.5 border rounded-xl shrink-0 ${act.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-700">
                      <span className="font-bold text-slate-900">{act.user}</span> {act.detail}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// Simple placeholder components for icons not in lucide
function XCircleComponent(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
