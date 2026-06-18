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
  const todayStr = new Date().toISOString().split('T')[0];
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

  // --- Dynamic Graph & Chart Data Calculations ---
  
  // 1. Appointments Trend (Weekly analysis)
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trendData = daysOfWeek.map(day => ({ name: day, appointments: 0 }));

  appointments.forEach(app => {
    if (app.status === 'cancelled') return;
    try {
      const parts = app.appointment_date.split("-");
      let d: Date;
      if (parts[0].length === 4) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      const dayIndex = d.getDay();
      if (!isNaN(dayIndex)) {
        trendData[dayIndex].appointments += 1;
      }
    } catch (e) {
      // Ignore
    }
  });

  const appointmentsTrend = [
    trendData[1], // Mon
    trendData[2], // Tue
    trendData[3], // Wed
    trendData[4], // Thu
    trendData[5], // Fri
    trendData[6], // Sat
    trendData[0]  // Sun
  ];

  // 2. Hourly Call Traffic
  const callIntervals = [
    { name: "09:00", calls: 0, startHour: 8, endHour: 10 },
    { name: "11:00", calls: 0, startHour: 10, endHour: 12 },
    { name: "13:00", calls: 0, startHour: 12, endHour: 14 },
    { name: "15:00", calls: 0, startHour: 14, endHour: 16 },
    { name: "17:00", calls: 0, startHour: 16, endHour: 20 }
  ];

  callLogs.forEach(call => {
    try {
      const timeStr = call.time.toLowerCase();
      const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)/);
      if (match) {
        let hour = Number(match[1]);
        const isPm = match[3] === "pm";
        if (isPm && hour !== 12) hour += 12;
        if (!isPm && hour === 12) hour = 0;
        
        for (const interval of callIntervals) {
          if (hour >= interval.startHour && hour < interval.endHour) {
            interval.calls += 1;
            break;
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  });

  const dailyCalls = callIntervals.map(i => ({ name: i.name, calls: i.calls }));

  // 3. Service Distribution
  const servicesList = ["Root Canal", "Scaling & Polishing", "Routine Checkup", "Orthodontics"];
  const serviceColors: Record<string, string> = {
    "Root Canal": "#8b5cf6",
    "Scaling & Polishing": "#a78bfa",
    "Routine Checkup": "#c084fc",
    "Orthodontics": "#ddd6fe"
  };

  const serviceCounts: Record<string, number> = {};
  servicesList.forEach(s => serviceCounts[s] = 0);
  let totalCountedServices = 0;

  appointments.forEach(app => {
    if (app.status === 'cancelled') return;
    const sType = app.service_type || "Routine Checkup";
    let matched = "Routine Checkup";
    for (const s of servicesList) {
      if (sType.toLowerCase().includes(s.toLowerCase())) {
        matched = s;
        break;
      }
    }
    serviceCounts[matched] += 1;
    totalCountedServices += 1;
  });

  const serviceDistribution = servicesList.map(s => {
    const percentage = totalCountedServices > 0 ? Math.round((serviceCounts[s] / totalCountedServices) * 100) : 0;
    return {
      name: s,
      value: percentage,
      color: serviceColors[s]
    };
  });

  // Recent Activity Panel Feed (Calculated dynamically)
  const recentActivities = appointments
    .map(app => {
      if (app.status === 'cancelled') {
        return {
          id: `act-cancel-${app.id}`,
          type: "cancellation",
          user: app.name,
          detail: `cancelled ${app.service_type || "dental"} appointment`,
          time: app.created_at ? new Date(app.created_at).toLocaleDateString() : "Recently",
          icon: FileText,
          color: "bg-rose-50 text-rose-600 border-rose-100"
        };
      } else {
        return {
          id: `act-book-${app.id}`,
          type: "booking",
          user: app.name,
          detail: `booked ${app.service_type || "dental"} appointment for ${app.appointment_date} at ${app.appointment_time}`,
          time: app.created_at ? new Date(app.created_at).toLocaleDateString() : "Recently",
          icon: UserPlus,
          color: "bg-emerald-50 text-emerald-600 border-emerald-100"
        };
      }
    })
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 3);

  if (recentActivities.length === 0) {
    recentActivities.push({
      id: "act-empty",
      type: "info",
      user: "System",
      detail: "ready to schedule appointments",
      time: "Now",
      icon: FileText,
      color: "bg-violet-50 text-violet-600 border-violet-100"
    });
  }

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
              <AreaChart data={appointmentsTrend}>
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
              <BarChart data={dailyCalls}>
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
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {serviceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {serviceDistribution.map((service, index) => (
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
