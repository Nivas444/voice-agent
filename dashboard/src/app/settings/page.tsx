"use client";

import React, { useEffect, useState } from "react";
import { 
  Building2, 
  Clock, 
  Settings2, 
  Sparkles, 
  Save, 
  Volume2,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { ClinicSettings } from "@/types";

const VOICE_OPTIONS = [
  { value: "en-US-Neural-F-Soft", label: "Emily (Soft female)" },
  { value: "en-US-Neural-M-Active", label: "James (Professional male)" },
  { value: "en-GB-Neural-F-British", label: "Charlotte (British female)" },
  { value: "hi-IN-Neural-F-Indian", label: "Aisha (Hindi-English female)" }
];

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "hi-IN", label: "Hindi / English (India)" },
  { value: "es-ES", label: "Spanish (Spain)" }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Voice synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const data = api.getSettings();
    setSettings(data);
  }, []);

  const handleChange = (field: keyof ClinicSettings, value: string | number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value
    });
    setSaveSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      api.saveSettings(settings);
      setSaveSuccess(true);
      // Reload page layout contexts by triggering a fast router refresh or alert
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Speaks the greeting using Browser Web Speech API as an interactive demo!
  const handleTestGreeting = () => {
    if (!settings || !settings.greeting_message) return;
    
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(settings.greeting_message);
    
    // Attempt language mapping
    utterance.lang = settings.language;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!settings) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading settings dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Settings</h2>
          <p className="text-xs text-slate-500 font-medium">Configure clinic profile info, operational hours, and AI agent voice parameters</p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-right-2 duration-200">
              <CheckCircle className="w-4 h-4" /> Saved Successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-violet-600/10 flex items-center justify-center gap-1.5 transition-all"
          >
            <Save className="w-4.5 h-4.5" /> {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clinic Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-violet-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Clinic Profile</h3>
          </div>
          <div className="p-6 space-y-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider">Clinic / Organization Name</label>
              <input
                type="text"
                required
                value={settings.clinic_name}
                onChange={(e) => handleChange("clinic_name", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider">Clinic Address</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider">Contact Number</label>
              <input
                type="tel"
                required
                value={settings.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Working Hours & Calendar Slots Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-violet-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Operations & Slots</h3>
          </div>
          <div className="p-6 space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">Opening Time</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 09:00 AM"
                  value={settings.open_time}
                  onChange={(e) => handleChange("open_time", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">Closing Time</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 06:00 PM"
                  value={settings.close_time}
                  onChange={(e) => handleChange("close_time", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">Slot Duration (Min)</label>
                <input
                  type="number"
                  required
                  value={settings.slot_duration}
                  onChange={(e) => handleChange("slot_duration", parseInt(e.target.value) || 30)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">Buffer Time (Min)</label>
                <input
                  type="number"
                  required
                  value={settings.buffer_time}
                  onChange={(e) => handleChange("buffer_time", parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Receptionist Settings Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden md:col-span-2">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h3 className="font-extrabold text-sm text-slate-900">AI Receptionist Persona</h3>
            </div>
            <button
              type="button"
              onClick={handleTestGreeting}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                isSpeaking 
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
                  : "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
              }`}
            >
              <Volume2 className="w-4 h-4 animate-bounce" /> {isSpeaking ? "Stop Voice Test" : "Test Persona Voice"}
            </button>
          </div>
          <div className="p-6 space-y-5 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">Voice Character Profile</label>
                <select
                  value={settings.voice}
                  onChange={(e) => handleChange("voice", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none"
                >
                  {VOICE_OPTIONS.map(v => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase tracking-wider">Agent Language Profile</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold focus:outline-none"
                >
                  {LANGUAGE_OPTIONS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider">System Greeting Hook Prompt</label>
              <textarea
                value={settings.greeting_message}
                onChange={(e) => handleChange("greeting_message", e.target.value)}
                placeholder="Write the exact script the AI receptionist should read when a new call starts."
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-[110px]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
