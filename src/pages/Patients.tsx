import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

const API_BASE_URL = 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 12000;

type DashboardAppointment = {
  _id: string;
  patient_id?: string;
  patient_name?: string;
  date: string;
  time: string;
};

type DoctorDashboardResponse = {
  total_patients?: number;
  schedule?: DashboardAppointment[];
};

type PatientListItem = {
  id: string;
  name: string;
  lastVisit: string;
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

function formatVisitDate(date: string) {
  if (!date) {
    return 'Not available';
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function Patients() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<DashboardAppointment[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please log in again to view your patients.');
        setLoading(false);
        return;
      }

      try {
        const data = await requestJson(`${API_BASE_URL}/doctors/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }) as DoctorDashboardResponse;

        setSchedule(Array.isArray(data?.schedule) ? data.schedule : []);
        setTotalPatients(data?.total_patients ?? 0);
        setError('');
      } catch (loadError) {
        console.error('Failed to load patients:', loadError);
        setSchedule([]);
        setTotalPatients(0);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load patients.');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  const patients = useMemo(() => {
    const patientMap = new Map<string, PatientListItem>();

    schedule.forEach((appointment) => {
      const id = appointment.patient_id || appointment.patient_name || appointment._id;
      const name = appointment.patient_name || 'Patient';
      const existing = patientMap.get(id);

      if (!existing) {
        patientMap.set(id, {
          id,
          name,
          lastVisit: appointment.date || ''
        });
        return;
      }

      const existingDate = existing.lastVisit ? new Date(`${existing.lastVisit}T00:00:00`).getTime() : 0;
      const appointmentDate = appointment.date ? new Date(`${appointment.date}T00:00:00`).getTime() : 0;

      if (appointmentDate > existingDate) {
        patientMap.set(id, {
          ...existing,
          lastVisit: appointment.date || existing.lastVisit
        });
      }
    });

    return Array.from(patientMap.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [schedule]);

  const openPatientTrends = (patient: PatientListItem) => {
    const searchParams = new URLSearchParams({
      patientId: patient.id,
      patientName: patient.name,
    });

    navigate(`/health-trends?${searchParams.toString()}`);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BackButton />
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">My Patients</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Database-synced patient list linked to your appointments.
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">Total Patients</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? '...' : totalPatients}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">
            No patients are linked to your profile yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {patients.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  onClick={() => openPatientTrends(patient)}
                  className="w-full p-6 flex items-center justify-between gap-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 dark:text-white font-medium">{patient.name}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <TrendingUp className="h-3.5 w-3.5" />
                        View trends
                      </span>
                    </div>
                    <span className="mt-1 block text-slate-500 dark:text-slate-400 text-sm">
                      Last visit: {formatVisitDate(patient.lastVisit)}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default Patients;
