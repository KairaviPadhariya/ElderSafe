import {
  Activity,
  Stethoscope,
  FileText,
  Calendar,
  Pill,
  AlertCircle,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import HealthRiskPrediction from './HealthRiskPrediction';
import QuickStats from './QuickStats';
import SOSButton from './SOSButton';

const API_BASE_URL = 'http://34.233.187.127:8000';
const REQUEST_TIMEOUT_MS = 12000;

interface Props {
  userName?: string;
}

type Appointment = {
  _id?: string;
  id?: string | number;
  doctor_name?: string;
  doctor_id?: string;
  specialty?: string;
  date: string;
  time: string;
  status?: string;
};

type DailyHealthLog = {
  _id?: string;
  log_date?: string;
  created_at?: string;
  updated_at?: string;
};

type MedicalDocument = {
  id?: string;
  uploaded_at?: string;
};

type MedicationDose = {
  medicine_name: string;
  scheduled_label: string;
};

type MedicationSummary = {
  total_doses: number;
  taken_count: number;
  pending_count: number;
  skipped_count: number;
  missed_count: number;
  next_dose?: MedicationDose | null;
};

type RiskHistoryEntry = {
  date: string;
  prediction: 'normal' | 'warning' | 'emergency';
  confidence: number;
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
      throw new Error('Request timed out. Please check that the backend and MongoDB are running.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function readCurrentRiskHistory() {
  try {
    const raw = localStorage.getItem('eldersafe-risk-history-current-patient');
    if (!raw) {
      return [] as RiskHistoryEntry[];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as RiskHistoryEntry[] : [];
  } catch {
    return [];
  }
}

function formatRiskLabel(prediction: RiskHistoryEntry['prediction']) {
  return prediction.charAt(0).toUpperCase() + prediction.slice(1);
}

function getAppointmentDateTime(appointment: Appointment) {
  return new Date(`${appointment.date}T${appointment.time}`);
}

function isUpcomingAppointment(appointment: Appointment, now = new Date()) {
  if (appointment.status === 'cancelled') {
    return false;
  }

  const appointmentDate = getAppointmentDateTime(appointment);
  return !Number.isNaN(appointmentDate.getTime()) && appointmentDate >= now;
}

function formatAppointmentSummary(appointment: Appointment) {
  const appointmentDate = getAppointmentDateTime(appointment);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const isToday = appointmentDate.toDateString() === now.toDateString();
  const isTomorrow = appointmentDate.toDateString() === tomorrow.toDateString();
  const dayLabel = isToday
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : appointmentDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

  const timeLabel = appointmentDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
  const doctorName = appointment.doctor_name || appointment.doctor_id || 'your doctor';

  return `${dayLabel}, ${timeLabel} with ${doctorName}`;
}

function formatRelativeTime(timestamp: Date) {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();

  if (Number.isNaN(diffMs)) {
    return 'Recently';
  }

  const minutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return timestamp.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function parseServerTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = /z$/i.test(value) ? value : `${value}Z`;
  const timestamp = new Date(normalizedValue);

  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function getLatestLogTimestamp(log: DailyHealthLog) {
  return (
    parseServerTimestamp(log.updated_at)
    || parseServerTimestamp(log.created_at)
    || parseServerTimestamp(log.log_date ? `${log.log_date}T00:00:00` : undefined)
  );
}

function PatientDashboard({ userName }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState('User');
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [appointmentError, setAppointmentError] = useState('');
  const [doctorCount, setDoctorCount] = useState<number | null>(null);
  const [lastHealthEntry, setLastHealthEntry] = useState('No entries yet');
  const [lastDocumentEntry, setLastDocumentEntry] = useState('No documents yet');
  const [medicationSummary, setMedicationSummary] = useState<MedicationSummary | null>(null);
  const [medicationError, setMedicationError] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [riskHistory, setRiskHistory] = useState<RiskHistoryEntry[]>([]);

  useEffect(() => {
    if (userName) {
      setName(userName);
    } else {
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        setName(storedName);
      }
    }
  }, [userName]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const syncRiskHistory = () => {
      setRiskHistory(readCurrentRiskHistory());
    };

    syncRiskHistory();
    window.addEventListener('ml-history-updated', syncRiskHistory as EventListener);

    return () => {
      window.removeEventListener('ml-history-updated', syncRiskHistory as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadNextAppointment = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setAppointmentError('Please log in again to view your appointments.');
        return;
      }

      try {
        const data = await requestJson(`${API_BASE_URL}/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const appointments = Array.isArray(data) ? (data as Appointment[]) : [];
        const upcomingAppointments = appointments
          .filter((appointment) => isUpcomingAppointment(appointment, currentTime))
          .sort((first, second) => getAppointmentDateTime(first).getTime() - getAppointmentDateTime(second).getTime());

        setNextAppointment(upcomingAppointments[0] ?? null);
        setAppointmentError('');
      } catch (error) {
        console.error('Failed to load next appointment:', error);
        setAppointmentError(error instanceof Error ? error.message : 'Unable to load your next appointment.');
      }
    };

    loadNextAppointment();
  }, [currentTime]);

  useEffect(() => {
    const loadLatestHealthEntry = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLastHealthEntry('Unavailable');
        return;
      }

      try {
        const data = await requestJson(`${API_BASE_URL}/daily_health_logs`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const logs = Array.isArray(data) ? (data as DailyHealthLog[]) : [];
        const latestTimestamp = logs
          .map(getLatestLogTimestamp)
          .filter((value): value is Date => value instanceof Date)
          .sort((first, second) => second.getTime() - first.getTime())[0];

        setLastHealthEntry(latestTimestamp ? formatRelativeTime(latestTimestamp) : 'No entries yet');
      } catch (error) {
        console.error('Failed to load latest health entry:', error);
        setLastHealthEntry('Unavailable');
      }
    };

    loadLatestHealthEntry();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await requestJson(`${API_BASE_URL}/doctors`);
        const doctors = Array.isArray(data) ? data : [];
        setDoctorCount(doctors.length);
      } catch (error) {
        console.error('Failed to load doctors count:', error);
        setDoctorCount(null);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    const loadLatestDocumentEntry = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLastDocumentEntry('Unavailable');
        return;
      }

      try {
        const data = await requestJson(`${API_BASE_URL}/medical-documents`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const documents = Array.isArray(data) ? (data as MedicalDocument[]) : [];
        const latestTimestamp = documents
          .map((document) => parseServerTimestamp(document.uploaded_at))
          .filter((value): value is Date => value instanceof Date)
          .sort((first, second) => second.getTime() - first.getTime())[0];

        setLastDocumentEntry(latestTimestamp ? formatRelativeTime(latestTimestamp) : 'No documents yet');
      } catch (error) {
        console.error('Failed to load latest document entry:', error);
        setLastDocumentEntry('Unavailable');
      }
    };

    loadLatestDocumentEntry();
  }, []);

  useEffect(() => {
    const loadMedicationSummary = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setMedicationError('Please log in again to view medications.');
        return;
      }

      try {
        const data = await requestJson(`${API_BASE_URL}/medications/today`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setMedicationSummary((data?.summary as MedicationSummary | null) ?? null);
        setMedicationError('');
      } catch (error) {
        console.error('Failed to load medication summary:', error);
        setMedicationError(error instanceof Error ? error.message : 'Unable to load medications.');
      }
    };

    loadMedicationSummary();
  }, []);

  const appointmentStats = nextAppointment
    ? `Next: ${formatAppointmentSummary(nextAppointment)}`
    : appointmentError
      ? 'Unable to load appointment'
      : 'No upcoming appointments';

  const medicationStats = medicationSummary
    ? medicationSummary.next_dose
      ? `Next: ${medicationSummary.next_dose.medicine_name} at ${medicationSummary.next_dose.scheduled_label}`
      : medicationSummary.total_doses > 0
        ? 'All doses complete today'
        : 'No medications scheduled'
    : medicationError || 'Loading medication plan';

  const medicationReminder = medicationSummary?.next_dose
    ? `Next dose: ${medicationSummary.next_dose.medicine_name} at ${medicationSummary.next_dose.scheduled_label}.`
    : medicationSummary?.total_doses
      ? 'Great work. All scheduled medication doses are complete for today.'
      : medicationError || 'Add medications to start getting daily reminders.';

  const doctorStats = doctorCount === null
    ? 'Doctors unavailable'
    : doctorCount === 0
      ? 'No doctors added'
      : `${doctorCount} doctor${doctorCount === 1 ? '' : 's'}`;

  const healthEntryStats = `Last entry: ${lastHealthEntry}`;
  const healthTrendStats = riskHistory.length > 0
    ? `Recent risk: ${riskHistory.slice(-3).map((entry) => formatRiskLabel(entry.prediction)).join(' -> ')}`
    : 'No risk history yet';

  const featureCards = [
    {
      id: 'health-entry',
      title: 'Log Health Data',
      description: 'Record heart rate, blood pressure, and glucose levels',
      icon: Plus,
      color: 'bg-blue-500',
      stats: healthEntryStats,
      path: '/daily-logs'
    },
    {
      id: 'health-tracker',
      title: 'Health Trends',
      description: 'View 7-day trends and patterns',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      stats: healthTrendStats,
      path: '/health-trends'
    },
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Schedule and manage doctor visits',
      icon: Calendar,
      color: 'bg-violet-500',
      stats: appointmentStats,
      path: '/appointments'
    },
    {
      id: 'doctors',
      title: 'My Doctors',
      description: 'Contact your healthcare providers',
      icon: Stethoscope,
      color: 'bg-cyan-500',
      stats: doctorStats,
      path: '/doctors'
    },
    {
      id: 'medications',
      title: 'Medications',
      description: 'Track your medicines and dosages',
      icon: Pill,
      color: 'bg-orange-500',
      stats: medicationStats,
      path: '/medications'
    },
    {
      id: 'medical-history',
      title: 'Medical History',
      description: 'Conditions, allergies, and past records',
      icon: FileText,
      color: 'bg-pink-500',
      stats: `Last updated: ${lastDocumentEntry}`,
      path: '/medical-history'
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-300">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Welcome back, {name}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Here&apos;s your health overview
        </p>
      </div>

      <QuickStats />
      <HealthRiskPrediction />

      <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Next Appointment
        </h3>
        <p className="text-slate-700 dark:text-slate-300">
          {nextAppointment
            ? formatAppointmentSummary(nextAppointment)
            : appointmentError || 'No upcoming appointments scheduled.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {featureCards.map((card) => {
          const Icon = card.icon;

          const gradientMap: { [key: string]: string } = {
            'bg-blue-500': 'from-blue-500 to-blue-600',
            'bg-emerald-500': 'from-emerald-500 to-emerald-600',
            'bg-violet-500': 'from-violet-500 to-violet-600',
            'bg-cyan-500': 'from-cyan-500 to-cyan-600',
            'bg-orange-500': 'from-orange-500 to-orange-600',
            'bg-pink-500': 'from-pink-500 to-pink-600',
          };

          const gradient = gradientMap[card.color] || 'from-slate-500 to-slate-600';

          return (
            <button
              key={card.id}
              onClick={() => navigate(card.path)}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700 p-8 transition-all duration-300 hover:-translate-y-1 text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20">
                <Icon className={`w-32 h-32 ${card.color.replace('bg-', 'text-')}`} />
              </div>

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`bg-gradient-to-br ${gradient} p-4 rounded-xl shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                  {card.description}
                </p>

                <div className="flex items-center text-sm text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                  <Activity className="w-4 h-4 mr-2" />
                  {card.stats}
                </div>

                {card.id === 'health-tracker' && riskHistory.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {riskHistory.slice(-4).map((entry) => {
                      const timelineClasses =
                        entry.prediction === 'emergency'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : entry.prediction === 'warning'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';

                      return (
                        <span
                          key={`${entry.date}-${entry.prediction}`}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${timelineClasses}`}
                        >
                          {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {formatRiskLabel(entry.prediction)}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border">
        <div className="flex items-start gap-6">
          <div className="bg-amber-100 p-3 rounded-full">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900 mb-2">
              Health Reminders
            </h3>
            <p className="text-amber-800">
              {medicationReminder}
            </p>
          </div>
        </div>
      </div>

      <SOSButton />
    </main>
  );
}

export default PatientDashboard;
