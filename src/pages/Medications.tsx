import { useEffect, useState } from 'react';
import { Pill, Clock, CalendarCheck, Plus, CheckCircle2, SkipForward, AlertTriangle } from 'lucide-react';

import BackButton from '../components/BackButton';

const API_BASE_URL = 'http://34.233.187.127:8000';
const REQUEST_TIMEOUT_MS = 12000;

const DEFAULT_TIMES_BY_FREQUENCY: Record<string, string[]> = {
  'Once daily': ['08:00'],
  'Twice daily': ['08:00', '20:00'],
  'Thrice daily': ['08:00', '14:00', '20:00'],
  'Three times daily': ['08:00', '14:00', '20:00'],
  'Four times daily': ['06:00', '12:00', '18:00', '22:00'],
  'As needed': ['08:00'],
};

function getDefaultTimesForFrequency(frequency: string) {
  return [...(DEFAULT_TIMES_BY_FREQUENCY[frequency] || ['08:00'])];
}

function normalizeTimesForFrequency(currentTimes: string[], frequency: string) {
  const defaultTimes = getDefaultTimesForFrequency(frequency);
  return defaultTimes.map((defaultTime, index) => currentTimes[index] || defaultTime);
}

type Medication = {
  _id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  times?: string[];
  instructions?: string | null;
  start_date: string;
  duration_days: number;
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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: '',
    dosage: '',
    frequency: 'Once daily',
    times: getDefaultTimesForFrequency('Once daily'),
    instructions: '',
    start_date: new Date().toISOString().slice(0, 10),
    duration_days: '30'
  });

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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    if (name === 'frequency') {
      setFormData((current) => ({
        ...current,
        frequency: value,
        times: normalizeTimesForFrequency(current.times, value),
      }));
      return;
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleTimeChange = (index: number, value: string) => {
    setFormData((current) => ({
      ...current,
      times: current.times.map((time, timeIndex) => (timeIndex === index ? value : time)),
    }));
  };

  const handleCreateMedication = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError('Please log in again to manage medications.');
      return;
    }

    setSaving(true);
    setFeedback('');

    try {
      const times = formData.times
        .map((value) => value.trim())
        .filter(Boolean);

      await requestJson(`${API_BASE_URL}/medications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicine_name: formData.medicine_name,
          dosage: formData.dosage,
          frequency: formData.frequency,
          times,
          instructions: formData.instructions || null,
          start_date: formData.start_date,
          duration_days: Number.parseInt(formData.duration_days, 10)
        })
      });

      setFormData({
        medicine_name: '',
        dosage: '',
        frequency: 'Once daily',
        times: getDefaultTimesForFrequency('Once daily'),
        instructions: '',
        start_date: new Date().toISOString().slice(0, 10),
        duration_days: '30'
      });
      setShowForm(false);
      setFeedback('Medication saved successfully.');
      await loadMedicationData();
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (saveError) {
      console.error('Failed to save medication:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save medication.');
    } finally {
      setSaving(false);
    }
  };

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
            <p className="text-slate-500 dark:text-slate-400">Manage medicines, due times, and daily adherence</p>
          </div>

          <button
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Close Form' : 'Add Medication'}
          </button>
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

        {showForm && (
          <form onSubmit={handleCreateMedication} className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="medicine_name"
                value={formData.medicine_name}
                onChange={handleInputChange}
                placeholder="Medicine name"
                required
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 dark:text-white outline-none"
              />
              <input
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                placeholder="Dosage"
                required
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 dark:text-white outline-none"
              />
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 dark:text-white outline-none"
              >
                <option>Once daily</option>
                <option>Twice daily</option>
                <option>Thrice daily</option>
                <option>Three times daily</option>
                <option>Four times daily</option>
                <option>As needed</option>
              </select>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 px-4 py-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Dose times</p>
                <div className="space-y-3">
                  {formData.times.map((time, index) => (
                    <div key={`${formData.frequency}-${index}`} className="flex items-center gap-3">
                      <label className="w-24 text-sm text-slate-500 dark:text-slate-400">
                        Dose {index + 1}
                      </label>
                      <input
                        type="time"
                        value={time}
                        onChange={(event) => handleTimeChange(index, event.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-4 py-2.5 dark:text-white outline-none"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 dark:text-white outline-none"
              />
              <input
                type="number"
                min="1"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleInputChange}
                placeholder="Duration in days"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 dark:text-white outline-none"
              />
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder="Instructions like after food"
                rows={3}
                className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 dark:text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 transition-colors disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Medication'}
            </button>
          </form>
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
