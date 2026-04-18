import { useEffect, useState } from 'react';
import { Pill, Clock, CalendarCheck, CheckCircle2, SkipForward, AlertTriangle } from 'lucide-react';

import BackButton from '../components/BackButton';
import { logActivitySafely } from '../utils/logging';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 12000;

type Medication = {
  _id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  times?: string[];
  instructions?: string | null;
  start_date: string;
  duration_days: number;
  doctor_note?: string | null;
  prescribed_by_name?: string | null;
  refill?: {
    days_remaining?: number | null;
    status: 'active' | 'refill_soon' | 'refill_due' | 'unknown';
    label: string;
  };
};

type Dose = {
  medication_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  instructions?: string | null;
  scheduled_time: string;
  scheduled_label: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  log_date: string;
};

type ScheduleSummary = {
  total_doses: number;
  taken_count: number;
  pending_count: number;
  skipped_count: number;
  missed_count: number;
  next_dose?: Dose | null;
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

function Medications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<Dose[]>([]);
  const [summary, setSummary] = useState<ScheduleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const token = localStorage.getItem('token');

  const loadMedicationData = async () => {
    if (!token) {
      setError('Please log in again to manage medications.');
      setLoading(false);
      return;
    }

    try {
      const [medicationsData, todayData] = await Promise.all([
        requestJson(`${API_BASE_URL}/medications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        requestJson(`${API_BASE_URL}/medications/today`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setMedications(Array.isArray(medicationsData) ? (medicationsData as Medication[]) : []);
      setSchedule(Array.isArray(todayData?.schedule) ? (todayData.schedule as Dose[]) : []);
      setSummary((todayData?.summary as ScheduleSummary | null) ?? null);
      setError('');
    } catch (loadError) {
      console.error('Failed to load medications:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load medications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicationData();
  }, []);

  const handleDoseUpdate = async (dose: Dose, status: 'taken' | 'skipped' | 'missed') => {
    if (!token) {
      setError('Please log in again to manage medications.');
      return;
    }

    setSaving(true);
    setFeedback('');

    try {
      await requestJson(`${API_BASE_URL}/medications/${dose.medication_id}/log`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduled_time: dose.scheduled_time,
          status,
          log_date: dose.log_date
        })
      });

      await logActivitySafely({
        action: 'medication_status_updated',
        activity_type: 'medication_dose',
        description: `${dose.medicine_name} marked as ${status}.`,
        metadata: {
          medication_id: dose.medication_id,
          medicine_name: dose.medicine_name,
          dosage: dose.dosage,
          scheduled_time: dose.scheduled_time,
          scheduled_label: dose.scheduled_label,
          log_date: dose.log_date,
          status
        }
      });

      setFeedback(`${dose.medicine_name} marked as ${status}.`);
      await loadMedicationData();
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (updateError) {
      console.error('Failed to update medication log:', updateError);
      setError(updateError instanceof Error ? updateError.message : 'Unable to update medication status.');
    } finally {
      setSaving(false);
    }
  };

  const nextDoseLabel = summary?.next_dose
    ? `${summary.next_dose.medicine_name} at ${summary.next_dose.scheduled_label}`
    : 'All scheduled doses are complete';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <BackButton />

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <Pill className="w-8 h-8 text-orange-500" />
              My Medications
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Review the medicines your doctor prescribed and update each dose as taken, skipped, or missed
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {feedback && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Today&apos;s doses</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary?.total_doses ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{summary?.taken_count ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Next dose</p>
            <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{nextDoseLabel}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              After you mark one dose as taken, this updates to the next scheduled time automatically.
            </p>
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-500" />
            Today&apos;s Schedule
          </h2>

          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Loading medication schedule...</p>
          ) : schedule.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No active medications scheduled for today.</p>
          ) : (
            <div className="space-y-4">
              {schedule.map((dose) => (
                <div key={`${dose.medication_id}-${dose.scheduled_time}`} className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dose.medicine_name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{dose.dosage} • {dose.frequency}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <Clock className="w-3 h-3" />
                          {dose.scheduled_label}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium ${
                          dose.status === 'taken'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : dose.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        }`}>
                          {dose.status}
                        </span>
                      </div>
                      {dose.instructions && (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{dose.instructions}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleDoseUpdate(dose, 'taken')}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-70"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Taken
                      </button>
                      <button
                        onClick={() => handleDoseUpdate(dose, 'skipped')}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 text-sm font-semibold disabled:opacity-70"
                      >
                        <SkipForward className="w-4 h-4" />
                        Skipped
                      </button>
                      <button
                        onClick={() => handleDoseUpdate(dose, 'missed')}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-70"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Missed
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {medications.map((medication) => (
            <div key={medication._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                    <Pill className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {medication.medicine_name}
                      <span className="text-sm font-normal text-slate-500 ml-2">{medication.dosage}</span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">{medication.frequency}</p>
                    <div className="flex flex-wrap gap-2">
                      {(medication.times || []).map((time) => (
                        <span key={time} className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          <Clock className="w-3 h-3 mr-1.5" />
                          {time}
                        </span>
                      ))}
                      {medication.refill && (
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg ${
                          medication.refill.status === 'refill_due'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            : medication.refill.status === 'refill_soon'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}>
                          {medication.refill.label}
                        </span>
                      )}
                    </div>
                    {medication.instructions && (
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{medication.instructions}</p>
                    )}
                    {medication.doctor_note && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Doctor note: {medication.doctor_note}
                      </p>
                    )}
                    {medication.prescribed_by_name && (
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Prescribed by Dr. {medication.prescribed_by_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Start: {medication.start_date} • Duration: {medication.duration_days} day{medication.duration_days !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Medications;
