import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Activity, Heart, Droplets, FileText } from 'lucide-react';

import BackButton from '../components/BackButton';

const API_BASE_URL = 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 12000;

type DailyLogFormState = {
    systolicBp: string;
    diastolicBp: string;
    heartRate: string;
    o2Saturation: string;
    fastingBloodGlucose: string;
    postPrandialGlucose: string;
    temperature: string;
    notes: string;
};

type DailyLogResponse = {
    _id?: string;
    log_date: string;
    systolic_bp: number;
    diastolic_bp: number;
    heart_rate: number;
    o2_saturation?: number;
    fasting_blood_glucose?: number;
    post_prandial_glucose?: number;
    weight?: number;
    temperature?: number;
    notes?: string;
};

type FamilyRecord = {
    patient_id?: string;
    patient_name?: string;
};

function createEmptyFormState(): DailyLogFormState {
    return {
        systolicBp: '120',
        diastolicBp: '80',
        heartRate: '',
        o2Saturation: '',
        fastingBloodGlucose: '',
        postPrandialGlucose: '',
        temperature: '',
        notes: ''
    };
}

function getTodayDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().split('T')[0];
}

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

function DailyLogs() {
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole') || 'patient';
    const isFamilyView = role === 'family';
    const [formData, setFormData] = useState<DailyLogFormState>(createEmptyFormState());
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [linkedPatientName, setLinkedPatientName] = useState('');
    const [dailyEntries, setDailyEntries] = useState<DailyLogResponse[]>([]);
    const [showPastEntries, setShowPastEntries] = useState(false);
    const todayDate = getTodayDate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((current) => ({
            ...current,
            [name]: value
        }));
    };

    const loadLogs = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError(isFamilyView ? 'Please log in again to manage the patient daily log.' : 'Please log in again to manage your daily health log.');
            setInitialLoading(false);
            return;
        }

        try {
            let familyData: FamilyRecord | null = null;

            if (isFamilyView) {
                const response = await requestJson(`${API_BASE_URL}/family/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                familyData = response as FamilyRecord | null;
                setLinkedPatientName(familyData?.patient_name || '');
            }

            const [todayData, allLogsData] = await Promise.all([
                requestJson(`${API_BASE_URL}/daily_health_logs?log_date=${todayDate}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }),
                requestJson(`${API_BASE_URL}/daily_health_logs`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const todayLog = Array.isArray(todayData) ? todayData[0] : null;
            const allLogs = Array.isArray(allLogsData) ? allLogsData as DailyLogResponse[] : [];
            setDailyEntries(allLogs);

            if (todayLog) {
                const log = todayLog as DailyLogResponse;
                setFormData({
                    systolicBp: String(log.systolic_bp ?? ''),
                    diastolicBp: String(log.diastolic_bp ?? ''),
                    heartRate: String(log.heart_rate ?? ''),
                    o2Saturation: log.o2_saturation != null ? String(log.o2_saturation) : '',
                    fastingBloodGlucose: log.fasting_blood_glucose != null ? String(log.fasting_blood_glucose) : '',
                    postPrandialGlucose: log.post_prandial_glucose != null ? String(log.post_prandial_glucose) : '',
                    temperature: log.temperature != null ? String(log.temperature) : '',
                    notes: log.notes ?? ''
                });
            } else {
                setFormData(createEmptyFormState());
            }

        } catch (loadError) {
            console.error('Failed to load daily health log:', loadError);
            setError(loadError instanceof Error ? loadError.message : "Unable to load today's health log.");
        } finally {
            setInitialLoading(false);
        }
    }, [isFamilyView, todayDate]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const token = localStorage.getItem('token');

        if (!token) {
            setError(isFamilyView ? 'Please log in again to save the patient daily health log.' : 'Please log in again to save your daily health log.');
            return;
        }

        if (!formData.systolicBp || !formData.diastolicBp || !formData.heartRate) {
            setError('Blood pressure and heart rate are required.');
            return;
        }

        setLoading(true);

        try {
            await requestJson(`${API_BASE_URL}/daily_health_logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    log_date: todayDate,
                    systolic_bp: Number(formData.systolicBp),
                    diastolic_bp: Number(formData.diastolicBp),
                    heart_rate: Number(formData.heartRate),
                    o2_saturation: formData.o2Saturation ? Number(formData.o2Saturation) : null,
                    fasting_blood_glucose: formData.fastingBloodGlucose ? Number(formData.fastingBloodGlucose) : null,
                    post_prandial_glucose: formData.postPrandialGlucose ? Number(formData.postPrandialGlucose) : null,
                    temperature: formData.temperature ? Number(formData.temperature) : null,
                    notes: formData.notes.trim() || null
                })
            });

            setSuccessMessage(`${isFamilyView ? 'Patient' : 'Health'} log saved for ${todayDate}.`);
            await loadLogs();
        } catch (saveError) {
            console.error('Failed to save daily health log:', saveError);
            setError(saveError instanceof Error ? saveError.message : "Unable to save today's health log.");
        } finally {
            setLoading(false);
        }
    };

    const pageTitle = isFamilyView ? 'View Daily Entries' : 'Daily Health Log';
    const pageSubtitle = isFamilyView
        ? `Review entries for ${linkedPatientName || 'the linked patient'} and update today's log below.`
        : `Record your vitals for ${todayDate}`;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                <BackButton />
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{pageTitle}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{pageSubtitle}</p>
                </div>

                <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Past Daily Entries</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPastEntries((current) => !current)}
                            className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                        >
                            {showPastEntries ? 'Hide Past Entries' : 'View Past Entries'}
                        </button>
                    </div>

                    {!showPastEntries ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Past daily logs are hidden by default. Click &quot;View Past Entries&quot; to see earlier records.
                        </p>
                    ) : dailyEntries.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No daily log entries found yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-900/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">BP</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Heart Rate</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Oxygen</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Glucose</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {dailyEntries.map((entry) => (
                                        <tr key={entry._id || entry.log_date} className="align-top">
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{entry.log_date}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                                                {entry.systolic_bp}/{entry.diastolic_bp}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{entry.heart_rate} bpm</td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{entry.o2_saturation ?? '--'}%</td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                                                F: {entry.fasting_blood_glucose ?? '--'} / PP: {entry.post_prandial_glucose ?? '--'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                                                {entry.notes || 'No notes'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && !isFamilyView && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3">
                            {successMessage}
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-rose-500" />
                            Cardiovascular
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Systolic BP</label>
                                <input
                                    type="number"
                                    name="systolicBp"
                                    value={formData.systolicBp}
                                    onChange={handleChange}
                                    disabled={initialLoading || loading}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-70"
                                    placeholder="120"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Diastolic BP</label>
                                <input
                                    type="number"
                                    name="diastolicBp"
                                    value={formData.diastolicBp}
                                    onChange={handleChange}
                                    disabled={initialLoading || loading}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-70"
                                    placeholder="80"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Heart Rate</label>
                                <input
                                    type="number"
                                    name="heartRate"
                                    value={formData.heartRate}
                                    onChange={handleChange}
                                    disabled={initialLoading || loading}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-70"
                                    placeholder="72"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Oxygen Saturation (%)</label>
                                <input
                                    type="number"
                                    name="o2Saturation"
                                    value={formData.o2Saturation}
                                    onChange={handleChange}
                                    disabled={initialLoading || loading}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-70"
                                    placeholder="98"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-blue-500" />
                            Blood Glucose
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fasting</label>
                                <input
                                    type="number"
                                    name="fastingBloodGlucose"
                                    value={formData.fastingBloodGlucose}
                                    onChange={handleChange}
                                    disabled={initialLoading || loading}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-70"
                                    placeholder="mg/dL"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Post-Prandial</label>
                                <input
                                    type="number"
                                    name="postPrandialGlucose"
                                    value={formData.postPrandialGlucose}
                                    onChange={handleChange}
                                    disabled={initialLoading || loading}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-70"
                                    placeholder="mg/dL"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            Temperature And Notes
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Temperature (C)</label>
                                <input
                                    type="number"
                                    name="temperature"
                                    step="0.1"
                                    value={formData.temperature}
                                    onChange={handleChange}
                                    disabled={initialLoading || loading}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-70"
                                    placeholder="37.0"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                disabled={initialLoading || loading}
                                rows={4}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-70 resize-none"
                                placeholder="Any symptoms, meals, medication reactions, or other observations"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            disabled={loading}
                            className="flex-1 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-70"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || initialLoading}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-70"
                        >
                            {loading ? 'Saving...' : initialLoading ? 'Loading...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Log
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DailyLogs;
