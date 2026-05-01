import {
  Calendar,
  Clock,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  userName?: string;
}

interface DashboardAppointment {
  _id: string;
  patient_id?: string;
  patient_name?: string;
  date: string;
  time: string;
  reason?: string;
  location?: string;
  status?: string;
}

interface DoctorDashboardData {
  total_patients: number;
  total_appointments: number;
  appointments_today: number;
  schedule: DashboardAppointment[];
}

const DEFAULT_API_BASE_URL = 'http://10.22.60.236:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 12000;

const emptyDashboard: DoctorDashboardData = {
  total_patients: 0,
  total_appointments: 0,
  appointments_today: 0,
  schedule: []
};

async function requestJson(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(data?.detail || data?.message || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check that the backend and database are running.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function formatAppointmentDate(date: string) {
  if (!date) {
    return 'Date not set';
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getAppointmentDateTime(appointment: DashboardAppointment) {
  return new Date(`${appointment.date}T${appointment.time}`);
}

function isUpcomingAppointment(appointment: DashboardAppointment, now = new Date()) {
  if (appointment.status === 'cancelled') {
    return false;
  }

  const appointmentDate = getAppointmentDateTime(appointment);
  return !Number.isNaN(appointmentDate.getTime()) && appointmentDate >= now;
}

function getPatientInitials(name?: string) {
  return (name || 'Patient')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'PT';
}

function DoctorDashboard({ userName }: Props) {
  const [name, setName] = useState('Doctor');
  const [dashboard, setDashboard] = useState<DoctorDashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (userName) {
      setName(userName);
      return;
    }

    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setName(storedName);
    }
  }, [userName]);

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please log in again to view your dashboard.');
      setLoading(false);
      return;
    }

    try {
      const data = await requestJson(`${API_BASE_URL}/doctors/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setDashboard({
        total_patients: data?.total_patients ?? 0,
        total_appointments: data?.total_appointments ?? 0,
        appointments_today: data?.appointments_today ?? 0,
        schedule: Array.isArray(data?.schedule) ? data.schedule : []
      });
      setError('');
    } catch (loadError) {
      console.error('Failed to load doctor dashboard:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.');
      setDashboard(emptyDashboard);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => ([
    { title: 'Total Patients', value: dashboard.total_patients.toString(), icon: Users, color: 'bg-blue-500' },
    { title: 'Total Appointments', value: dashboard.total_appointments.toString(), icon: Calendar, color: 'bg-cyan-500' },
    { title: 'Appointments Today', value: dashboard.appointments_today.toString(), icon: Clock, color: 'bg-emerald-500' },
  ]), [dashboard]);

  const upcomingSchedule = useMemo(
    () => dashboard.schedule.filter((appointment) => isUpcomingAppointment(appointment)),
    [dashboard.schedule]
  );

  const handleReschedule = async (id: string) => {
    if (!editDate || !editTime) {
      setError('Both date and time are required to reschedule an appointment.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please log in again to update the appointment.');
      return;
    }

    setSavingId(id);

    try {
      await requestJson(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: editDate,
          time: editTime
        })
      });

      setEditingId(null);
      setEditDate('');
      setEditTime('');
      setError('');
      await loadDashboard();
    } catch (saveError) {
      console.error('Failed to reschedule appointment:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to reschedule the appointment.');
    } finally {
      setSavingId(null);
    }
  };

  const startReschedule = (appointment: DashboardAppointment) => {
    setEditingId(appointment._id);
    setEditDate(appointment.date);
    setEditTime(appointment.time);
    setError('');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Welcome back, Dr. {name}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Here is your live schedule and patient overview
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {loading ? '...' : stat.value}
                  </h3>
                </div>

                <div className={`${stat.color} p-3 rounded-xl bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Appointment Schedule
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upcoming appointments linked to your doctor profile
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100 lg:max-w-sm">
              <p className="font-medium">Need to add notes or medications?</p>
              <p className="mt-1 text-emerald-800/80 dark:text-emerald-100/80">
                Open the appointments page and use <span className="font-semibold">Add Note &amp; Medication</span> on the patient&apos;s card.
              </p>
              <Link
                to="/appointments"
                className="mt-3 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Open Appointments
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">
            Loading dashboard data...
          </div>
        ) : upcomingSchedule.length === 0 ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">
            No upcoming appointments scheduled.
          </div>
        ) : (
          <div className="divide-y">
            {upcomingSchedule.map((appointment) => (
              <div key={appointment._id} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-100">
                      {getPatientInitials(appointment.patient_name)}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {appointment.patient_name || 'Patient'}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {(appointment.reason || 'General consultation')} | {formatAppointmentDate(appointment.date)} | {appointment.time}
                      </p>
                      {appointment.location && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {appointment.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {editingId === appointment._id ? (
                    <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
                      <input
                        type="date"
                        className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        value={editDate}
                        onChange={(event) => setEditDate(event.target.value)}
                      />
                      <input
                        type="time"
                        className="border rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        value={editTime}
                        onChange={(event) => setEditTime(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReschedule(appointment._id)}
                          disabled={savingId === appointment._id}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm disabled:opacity-70"
                        >
                          {savingId === appointment._id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditDate('');
                            setEditTime('');
                          }}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => startReschedule(appointment)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                      >
                        Reschedule
                      </button>
                      <Link
                        to="/appointments"
                        className="px-4 py-2 bg-emerald-500 text-center rounded-lg text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                      >
                        Add Note &amp; Medication
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default DoctorDashboard;
