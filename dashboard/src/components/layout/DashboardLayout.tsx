"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  PhoneCall, 
  CalendarDays, 
  Users, 
  Settings, 
  Menu, 
  X,
  Activity,
  LogOut,
  Database,
  Calendar,
  Sparkles,
  Phone
} from "lucide-react";
import { api } from "@/lib/api";
import { ClinicSettings } from "@/types";

interface SidebarLink {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Appointments", path: "/appointments", icon: CalendarCheck },
  { name: "Call Logs", path: "/calls", icon: PhoneCall },
  { name: "Calendar", path: "/calendar", icon: CalendarDays },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  
  // Status check simulations
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [googleCalConnected, setGoogleCalConnected] = useState(true);
  const [vapiConnected, setVapiConnected] = useState(true);

  useEffect(() => {
    // Load clinic settings
    const settings = api.getSettings();
    setClinicSettings(settings);

    // Close mobile menu on path changes
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    // Simulated logout
    alert("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 antialiased font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <img src="/sortyx_logo-removebg-preview.png" alt="SortyX Logo" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="font-bold text-white tracking-wide text-sm">SortyX AI Agent</h1>
            <p className="text-xs text-violet-400 font-medium">Receptionist Platform</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Integration Badges Panel */}
        <div className="px-6 py-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Integrations</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Database className="w-3.5 h-3.5 text-slate-500" /> Supabase DB
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Google Calendar
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> Vapi Voice Agent
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Footer Profile */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center text-white font-semibold text-sm shadow">
              {clinicSettings?.clinic_name?.[0] || "A"}
            </div>
            <div className="truncate max-w-[120px]">
              <p className="text-sm font-semibold text-white truncate">{clinicSettings?.clinic_name || "ABC Dental Clinic"}</p>
              <p className="text-xs text-slate-400 truncate">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer/Header Wrapper */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/sortyx_logo-removebg-preview.png" alt="SortyX Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-sm text-slate-900">SortyX AI Agent</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs">
            {clinicSettings?.clinic_name?.[0] || "A"}
          </div>
        </header>

        {/* Mobile Drawer Overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <div 
              className="w-64 bg-slate-900 h-full flex flex-col text-slate-300 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
                <img src="/sortyx_logo-removebg-preview.png" alt="SortyX Logo" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="font-bold text-white tracking-wide text-sm">SortyX AI Agent</h1>
                  <p className="text-xs text-violet-400 font-medium">Receptionist</p>
                </div>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1">
                {SIDEBAR_LINKS.map((link) => {
                  const isActive = pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                          : "hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center text-white font-semibold text-sm shadow">
                    {clinicSettings?.clinic_name?.[0] || "A"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{clinicSettings?.clinic_name || "ABC Dental Clinic"}</p>
                    <p className="text-xs text-slate-400">Admin</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-35">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {pathname === "/" ? "Dashboard" : pathname.replace("/", "").charAt(0).toUpperCase() + pathname.replace("/", "").slice(1)}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Welcome back, {clinicSettings?.clinic_name || "ABC Dental Clinic"}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 text-slate-600 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              FastAPI Connected (Live)
            </div>
            <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
