import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, FileText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { predictSafetyStatus } from '../services/seniorSafetyApi';

const API_BASE_URL = 'http://34.233.187.127:8000';
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

type PatientProfile = {
  _id?: string;
  user_id?: string;
  age?: number | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  o2_saturation?: number | null;
  heart_rate?: number | null;
  sbp?: number | null;
  dbp?: number | null;
  has_bp?: boolean | null;
  has_diabetes?: boolean | null;
  has_cardiac_history?: boolean | null;
  fbs?: number | null;
  ppbs?: number | null;
  cholesterol?: number | null;
};

type DailyHealthLog = {
  log_date?: string;
  created_at?: string;
  updated_at?: string;
  weight?: number | null;
  heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  o2_saturation?: number | null;
  fasting_blood_glucose?: number | null;
  post_prandial_glucose?: number | null;
};

type PatientPredictionStatus = {
  label: string;
  classes: string;
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

function parseTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = /z$/i.test(value) ? value : `${value}Z`;
  const timestamp = new Date(normalizedValue);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function getLogTimestamp(log: DailyHealthLog) {
  return (
    parseTimestamp(log.updated_at)
    || parseTimestamp(log.created_at)
    || parseTimestamp(log.log_date ? `${log.log_date}T00:00:00` : undefined)
  );
}

function calculateBmi(weight?: number | null, height?: number | null) {
  if (!weight || !height || height <= 0) {
    return null;
  }

  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

function getPredictionPresentation(status: string): PatientPredictionStatus {
  if (status === 'emergency') {
    return {
      label: 'Prediction: Emergency',
      classes: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
    };
  }

  if (status === 'warning') {
    return {
      label: 'Prediction: Warning',
      classes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
    };
  }

  if (status === 'normal') {
    return {
      label: 'Prediction: Normal',
      classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    };
  }

  return {
    label: 'Prediction unavailable',
    classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
  };
}

function Patients() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<DashboardAppointment[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patientPredictions, setPatientPredictions] = useState<Record<string, PatientPredictionStatus>>({});

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

  useEffect(() => {
    const loadPredictions = async () => {
      const token = localStorage.getItem('token');

      if (!token || patients.length === 0) {
        setPatientPredictions({});
        return;
      }

      try {
        const profilesData = await requestJson(`${API_BASE_URL}/patients`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const profiles = Array.isArray(profilesData) ? (profilesData as PatientProfile[]) : [];

        const predictionEntries = await Promise.all(
          patients.map(async (patient) => {
            const profile =
              profiles.find((entry) => entry._id === patient.id)
              || profiles.find((entry) => entry.user_id === patient.id)
              || null;

            if (!profile) {
              return [patient.id, getPredictionPresentation('')] as const;
            }

            const logsData = await requestJson(`${API_BASE_URL}/daily_health_logs?patient_id=${encodeURIComponent(patient.id)}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            const logs = Array.isArray(logsData) ? (logsData as DailyHealthLog[]) : [];
            const latestLog = [...logs]
              .sort((first, second) => {
                const firstTime = getLogTimestamp(first)?.getTime() ?? 0;
                const secondTime = getLogTimestamp(second)?.getTime() ?? 0;
                return secondTime - firstTime;
              })[0];

            const weight = latestLog?.weight ?? profile.weight ?? null;
            const bmi = profile.bmi ?? calculateBmi(weight, profile.height);
            const payload = {
              patient_id: profile._id ?? undefined,
              age: profile.age ?? null,
              gender: profile.gender ?? null,
              weight,
              bmi,
              o2_saturation: latestLog?.o2_saturation ?? profile.o2_saturation ?? null,
              hr: latestLog?.heart_rate ?? profile.heart_rate ?? null,
              sbp: latestLog?.systolic_bp ?? profile.sbp ?? null,
              dbp: latestLog?.diastolic_bp ?? profile.dbp ?? null,
              fbs: latestLog?.fasting_blood_glucose ?? profile.fbs ?? null,
              ppbs: latestLog?.post_prandial_glucose ?? profile.ppbs ?? null,
              cholesterol: profile.cholesterol ?? null,
              has_hypertension: Boolean(profile.has_bp),
              has_diabetes: Boolean(profile.has_diabetes),
              has_cardiac_history: Boolean(profile.has_cardiac_history)
            };

            const missingFields = Object.entries(payload)
              .filter(([key, value]) => key !== 'patient_id' && (value === null || value === undefined || value === ''))
              .map(([key]) => key);

            if (missingFields.length > 0) {
              return [patient.id, getPredictionPresentation('')] as const;
            }

            try {
              const prediction = await predictSafetyStatus({
                patient_id: payload.patient_id,
                age: Number(payload.age),
                gender: String(payload.gender),
                weight: Number(payload.weight),
                bmi: Number(payload.bmi),
                o2_saturation: Number(payload.o2_saturation),
                hr: Number(payload.hr),
                sbp: Number(payload.sbp),
                dbp: Number(payload.dbp),
                fbs: Number(payload.fbs),
                ppbs: Number(payload.ppbs),
                cholesterol: Number(payload.cholesterol),
                has_hypertension: payload.has_hypertension,
                has_diabetes: payload.has_diabetes,
                has_cardiac_history: payload.has_cardiac_history
              }) as { prediction?: string };

              return [patient.id, getPredictionPresentation(prediction.prediction || '')] as const;
            } catch (predictionError) {
              console.error(`Failed to load prediction for patient ${patient.id}:`, predictionError);
              return [patient.id, getPredictionPresentation('')] as const;
            }
          })
        );

        setPatientPredictions(Object.fromEntries(predictionEntries));
      } catch (loadError) {
        console.error('Failed to load patient predictions:', loadError);
        setPatientPredictions({});
      }
    };

    void loadPredictions();
  }, [patients]);

  const openPatientTrends = (patient: PatientListItem) => {
    const searchParams = new URLSearchParams({
      patientId: patient.id,
      patientName: patient.name,
    });

    navigate(`/health-trends?${searchParams.toString()}`);
  };

  const openPatientDocuments = (patient: PatientListItem) => {
    const searchParams = new URLSearchParams({
      patientId: patient.id,
      patientName: patient.name,
    });

    navigate(`/medical-history?${searchParams.toString()}`);
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
                <div className="w-full p-6 flex items-center justify-between gap-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-medium">{patient.name}</span>
                      </div>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${patientPredictions[patient.id]?.classes || 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'}`}>
                        {patientPredictions[patient.id]?.label || 'Prediction unavailable'}
                      </span>
                      <span className="mt-1 block text-slate-500 dark:text-slate-400 text-sm">
                        Last visit: {formatVisitDate(patient.lastVisit)}
                      </span>
                    </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPatientTrends(patient)}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      View trends
                    </button>
                    <button
                      type="button"
                      onClick={() => openPatientDocuments(patient)}
                      className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700 transition-colors hover:bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View documents
                    </button>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default Patients;
