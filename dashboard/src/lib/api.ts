import { Appointment, AvailabilityResponse, CallLog, Customer, ClinicSettings } from '../types';
import { MOCK_CALL_LOGS, MOCK_CUSTOMERS, INITIAL_SETTINGS } from './mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Local storage keys
const APPOINTMENTS_KEY = 'aura_appointments';
const CALLS_KEY = 'aura_calls';
const CUSTOMERS_KEY = 'aura_customers';
const SETTINGS_KEY = 'aura_settings';

// Helper to initialize local storage data if empty
const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return;

  // Force clean mock data if it exists from previous sessions to start fresh
  const existingApps = localStorage.getItem(APPOINTMENTS_KEY);
  if (!existingApps || existingApps.includes("app-1")) {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
  }

  const existingCalls = localStorage.getItem(CALLS_KEY);
  if (!existingCalls || existingCalls.includes("call-1")) {
    localStorage.setItem(CALLS_KEY, JSON.stringify([]));
  }

  const existingCusts = localStorage.getItem(CUSTOMERS_KEY);
  if (!existingCusts || existingCusts.includes("cust-1")) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
  }
};

// Execute initialization
initializeLocalStorage();

// Get items from local storage helper
const getLocalItems = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const items = localStorage.getItem(key);
  return items ? JSON.parse(items) : [];
};

// Save items to local storage helper
const setLocalItems = <T>(key: string, items: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
};

// API Services
export const api = {
  // --- Appointments ---
  async getAppointments(): Promise<Appointment[]> {
    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000) // 3s timeout fallback
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      
      const rawRemote = await response.json();
      const remoteAppointments = Array.isArray(rawRemote) ? rawRemote.map((app: any) => ({
        ...app,
        id: app.id || `remote-${Math.random().toString(36).substr(2, 9)}`,
        status: app.status || 'confirmed',
        service_type: app.service_type || 'General Dental'
      })) : [];
      
      // Merge remote appointments with local storage ones to retain client bookings
      const localAppointments = getLocalItems<Appointment>(APPOINTMENTS_KEY);
      const merged = [...remoteAppointments];
      
      // Add local ones not present in remote
      localAppointments.forEach(localApp => {
        if (!merged.some(r => r.id === localApp.id || (r.appointment_date === localApp.appointment_date && r.appointment_time === localApp.appointment_time))) {
          merged.push(localApp);
        }
      });
      
      return merged;
    } catch (error) {
      console.warn("Backend unavailable, falling back to local storage appointments.", error);
      return getLocalItems<Appointment>(APPOINTMENTS_KEY);
    }
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'status' | 'created_at'>): Promise<Appointment> {
    const localId = `app-${Math.random().toString(36).substr(2, 9)}`;
    const newAppointment: Appointment = {
      ...appointment,
      id: localId,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };

    // Attempt backend save
    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const result = await response.json();
        // Backend returns standard response. Extract data.
        if (result.success && result.data && result.data.length > 0) {
          const remoteApp = result.data[0];
          const localList = getLocalItems<Appointment>(APPOINTMENTS_KEY);
          localList.unshift(remoteApp);
          setLocalItems(APPOINTMENTS_KEY, localList);
          return remoteApp;
        }
      }
    } catch (error) {
      console.warn("Backend save failed, saving to local storage only.", error);
    }

    // Save locally
    const localList = getLocalItems<Appointment>(APPOINTMENTS_KEY);
    localList.unshift(newAppointment);
    setLocalItems(APPOINTMENTS_KEY, localList);
    
    // Auto-update customer total appointments count if they exist
    const customers = getLocalItems<Customer>(CUSTOMERS_KEY);
    const customer = customers.find(c => c.phone === appointment.phone || c.name.toLowerCase() === appointment.name.toLowerCase());
    if (customer) {
      customer.total_appointments += 1;
      customer.last_appointment = appointment.appointment_date;
      customer.appointments_history.unshift({
        id: localId,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        service_type: appointment.service_type || "General",
        status: "confirmed"
      });
      setLocalItems(CUSTOMERS_KEY, customers);
    } else {
      // Add new customer dynamically
      const newCustomer: Customer = {
        id: `cust-${Math.random().toString(36).substr(2, 9)}`,
        name: appointment.name,
        phone: appointment.phone,
        total_appointments: 1,
        last_appointment: appointment.appointment_date,
        preferred_service: appointment.service_type || "General",
        notes: "Registered via quick booking.",
        appointments_history: [{
          id: localId,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          service_type: appointment.service_type || "General",
          status: "confirmed"
        }],
        calls_history: []
      };
      customers.push(newCustomer);
      setLocalItems(CUSTOMERS_KEY, customers);
    }

    return newAppointment;
  },

  async checkAvailability(date: string, time: string): Promise<AvailabilityResponse> {
    try {
      const response = await fetch(`${API_URL}/api/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_date: date, appointment_time: time }),
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) throw new Error("Availability query failed");
      return await response.json();
    } catch (error) {
      console.warn("Backend unavailable, executing client-side availability check.", error);
      
      // Simulate client-side check using local appointments
      const appointments = getLocalItems<Appointment>(APPOINTMENTS_KEY);
      const isOccupied = appointments.some(
        app => app.appointment_date === date && app.appointment_time === time && app.status !== 'cancelled'
      );
      
      if (!isOccupied) {
        return { available: true, suggestions: [] };
      } else {
        // Generate mock suggestions
        const hours = parseInt(time.split(':')[0]);
        const minutesStr = time.split(':')[1].split(' ')[0];
        const isPM = time.includes('PM');
        
        let nextHour = hours;
        let nextMin = parseInt(minutesStr) === 30 ? 0 : 30;
        if (nextMin === 0) {
          nextHour = hours === 12 ? 1 : hours + 1;
        }
        
        const suffix = isPM ? 'PM' : 'AM';
        
        const formatSug = (h: number, m: number) => {
          const hStr = h.toString();
          const mStr = m === 0 ? '00' : '30';
          return `${hStr}:${mStr} ${suffix}`;
        };

        const sug1 = formatSug(nextHour, nextMin);
        
        let nextHour2 = nextHour;
        let nextMin2 = nextMin === 30 ? 0 : 30;
        if (nextMin2 === 0) nextHour2 = nextHour === 12 ? 1 : nextHour + 1;
        const sug2 = formatSug(nextHour2, nextMin2);

        let nextHour3 = nextHour2;
        let nextMin3 = nextMin2 === 30 ? 0 : 30;
        if (nextMin3 === 0) nextHour3 = nextHour2 === 12 ? 1 : nextHour2 + 1;
        const sug3 = formatSug(nextHour3, nextMin3);

        return {
          available: false,
          suggestions: [sug1, sug2, sug3]
        };
      }
    }
  },

  async rescheduleAppointment(id: string, date: string, time: string): Promise<Appointment> {
    const list = getLocalItems<Appointment>(APPOINTMENTS_KEY);
    const appIndex = list.findIndex(a => a.id === id);
    if (appIndex === -1) throw new Error("Appointment not found");
    
    list[appIndex].appointment_date = date;
    list[appIndex].appointment_time = time;
    list[appIndex].status = 'confirmed';
    setLocalItems(APPOINTMENTS_KEY, list);
    
    // Also update history of corresponding customer
    const customers = getLocalItems<Customer>(CUSTOMERS_KEY);
    for (const cust of customers) {
      const histItemIndex = cust.appointments_history.findIndex(h => h.id === id);
      if (histItemIndex !== -1) {
        cust.appointments_history[histItemIndex].date = date;
        cust.appointments_history[histItemIndex].time = time;
        cust.appointments_history[histItemIndex].status = 'confirmed';
      }
    }
    setLocalItems(CUSTOMERS_KEY, customers);
    
    return list[appIndex];
  },

  async cancelAppointment(id: string): Promise<Appointment> {
    const list = getLocalItems<Appointment>(APPOINTMENTS_KEY);
    const appIndex = list.findIndex(a => a.id === id);
    if (appIndex === -1) throw new Error("Appointment not found");
    
    list[appIndex].status = 'cancelled';
    setLocalItems(APPOINTMENTS_KEY, list);
    
    // Update customer history status
    const customers = getLocalItems<Customer>(CUSTOMERS_KEY);
    for (const cust of customers) {
      const histItemIndex = cust.appointments_history.findIndex(h => h.id === id);
      if (histItemIndex !== -1) {
        cust.appointments_history[histItemIndex].status = 'cancelled';
      }
    }
    setLocalItems(CUSTOMERS_KEY, customers);

    return list[appIndex];
  },

  // --- Call Logs ---
  getCallLogs(): CallLog[] {
    return getLocalItems<CallLog>(CALLS_KEY);
  },

  // --- Customers ---
  getCustomers(): Customer[] {
    return getLocalItems<Customer>(CUSTOMERS_KEY);
  },
  
  updateCustomerNotes(id: string, notes: string): Customer {
    const list = getLocalItems<Customer>(CUSTOMERS_KEY);
    const index = list.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    list[index].notes = notes;
    setLocalItems(CUSTOMERS_KEY, list);
    return list[index];
  },

  // --- Settings ---
  getSettings(): ClinicSettings {
    if (typeof window === 'undefined') return INITIAL_SETTINGS;
    const settings = localStorage.getItem(SETTINGS_KEY);
    return settings ? JSON.parse(settings) : INITIAL_SETTINGS;
  },

  saveSettings(settings: ClinicSettings): ClinicSettings {
    if (typeof window === 'undefined') return settings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }
};
