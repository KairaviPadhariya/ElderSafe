import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Droplets,
    FileText,
    Heart,
    MapPin,
    Phone,
    ShieldCheck,
    Stethoscope,
    TrendingUp,
    UserRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Props {
    userName?: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 12000;

type FamilyRecord = {
    _id?: string;
    name?: string;
    email?: string;
    patient_id?: string;
    patient_name?: string;
    relation?: string;
    access_level?: string;
    phone?: string | null;
    address?: string | null;
};

type PatientRecord = {
    _id: string;
    name?: string;
    age?: number;
    gender?: string;
    blood_group?: string;
    heart_rate?: number;
    o2_saturation?: number;
    sbp?: number;
    dbp?: number;
    bmi?: number | null;
    phone?: string | null;
    address?: string | null;
};

type SOSAlert = {
    _id: string;
    location?: string | null;
    status?: string;
    created_at?: string;
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

function formatGender(gender?: string) {
    if (!gender) {
        return 'Not provided';
    }

    return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function getVitalsStatus(patient: PatientRecord | null) {
    if (!patient) {
        return {
            title: 'Patient not linked yet',
            subtitle: 'Complete the family profile to connect this dashboard to a patient record.'
        };
    }

    const heartRateOk = patient.heart_rate !== undefined && patient.heart_rate >= 60 && patient.heart_rate <= 100;
    const o2Ok = patient.o2_saturation !== undefined && patient.o2_saturation >= 95;
    const bpOk =
        patient.sbp !== undefined &&
        patient.dbp !== undefined &&
        patient.sbp < 140 &&
        patient.dbp < 90;

    if (heartRateOk && o2Ok && bpOk) {
        return {
            title: 'Stable & Normal',
            subtitle: `Heart Rate: ${patient.heart_rate} bpm | O2 Level: ${patient.o2_saturation}%`
        };
    }

    return {
        title: 'Needs Attention',
        subtitle: `BP ${patient.sbp ?? '--'}/${patient.dbp ?? '--'} mmHg | Heart Rate ${patient.heart_rate ?? '--'} bpm`
    };
}

function formatSosTime(timestamp?: string) {
    if (!timestamp) {
        return 'just now';
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return 'recently';
    }

    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function FamilyDashboard({ userName }: Props) {
    const navigate = useNavigate();
    const [name, setName] = useState('User');
    const [familyRecord, setFamilyRecord] = useState<FamilyRecord | null>(null);
    const [linkedPatient, setLinkedPatient] = useState<PatientRecord | null>(null);
    const [activeSosAlert, setActiveSosAlert] = useState<SOSAlert | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        const loadDashboardData = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Please log in again to view the linked patient dashboard.');
                setLoading(false);
                return;
            }

            try {
                const [familyData, patientsData, sosData] = await Promise.all([
                    requestJson(`${API_BASE_URL}/family/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    requestJson(`${API_BASE_URL}/patients`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    requestJson(`${API_BASE_URL}/sos`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);

                const resolvedFamilyRecord = familyData as FamilyRecord | null;
                const patients = Array.isArray(patientsData) ? (patientsData as PatientRecord[]) : [];
                const sosAlerts = Array.isArray(sosData) ? (sosData as SOSAlert[]) : [];

                setFamilyRecord(resolvedFamilyRecord);

                if (!resolvedFamilyRecord) {
                    setLinkedPatient(null);
                    setError('Complete the family profile first to link this dashboard to a patient.');
                    return;
                }

                const matchedPatient =
                    patients.find((patient) => patient._id === resolvedFamilyRecord.patient_id) ||
                    patients.find((patient) => patient.name === resolvedFamilyRecord.patient_name) ||
                    null;

                const unresolvedAlerts = sosAlerts.filter((alert) => alert.status !== 'resolved');

                setLinkedPatient(matchedPatient);
                setActiveSosAlert(unresolvedAlerts[0] ?? null);
                setError(matchedPatient ? '' : 'The linked patient record could not be found in the database.');
            } catch (loadError) {
                console.error('Failed to load family dashboard:', loadError);
                setError(loadError instanceof Error ? loadError.message : 'Unable to load linked patient details.');
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const patientName = linkedPatient?.name || familyRecord?.patient_name || 'No patient linked';
    const relationLabel = familyRecord?.relation || 'Caregiver';
    const accessLevel = familyRecord?.access_level || 'Not provided';
    const patientAddress = linkedPatient?.address || familyRecord?.address || 'Address not provided';
    const patientPhone = linkedPatient?.phone || familyRecord?.phone || 'Not provided';
    const vitalsStatus = getVitalsStatus(linkedPatient);
    const sosStatusTitle = activeSosAlert ? 'SOS alert triggered' : 'SOS Status';
    const sosStatusMessage = activeSosAlert
        ? `${patientName} triggered SOS on ${formatSosTime(activeSosAlert.created_at)}.${activeSosAlert.location ? ` Location: ${activeSosAlert.location}.` : ''}`
        : 'No emergency alerts triggered recently.';
    const vitalsCards = [
        {
            label: 'Heart Rate',
            value: linkedPatient?.heart_rate ? `${linkedPatient.heart_rate} bpm` : 'Not provided',
            icon: Heart
        },
        {
            label: 'O2 Saturation',
            value: linkedPatient?.o2_saturation ? `${linkedPatient.o2_saturation}%` : 'Not provided',
            icon: Activity
        },
        {
            label: 'Blood Pressure',
            value:
                linkedPatient?.sbp !== undefined && linkedPatient?.dbp !== undefined
                    ? `${linkedPatient.sbp}/${linkedPatient.dbp} mmHg`
                    : 'Not provided',
            icon: TrendingUp
        },
        {
            label: 'Blood Group',
            value: linkedPatient?.blood_group || 'Not provided',
            icon: Droplets
        }
    ];
    const patientSummary = [
        { label: 'Patient Name', value: patientName },
        { label: 'Age', value: linkedPatient?.age ? `${linkedPatient.age}` : 'Not provided' },
        { label: 'Gender', value: formatGender(linkedPatient?.gender) },
        { label: 'BMI', value: linkedPatient?.bmi ? `${linkedPatient.bmi}` : 'Not provided' },
        { label: 'Relation', value: relationLabel },
        { label: 'Access Level', value: accessLevel }
    ];

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                        Welcome, {name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Monitoring status for:{ }
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {patientName}
                        </span>
                    </p>
                </div>
                <button
                    onClick={() => navigate('/daily-logs')}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <FileText className="w-5 h-5" />
                    View Daily Entries
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className={`rounded-2xl p-6 shadow-sm border flex items-center gap-4 ${activeSosAlert
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}>
                    <div className={`p-3 rounded-full ${activeSosAlert
                        ? 'bg-rose-100 dark:bg-rose-900/40'
                        : 'bg-rose-100 dark:bg-rose-900/30'
                        }`}>
                        <AlertTriangle className={`w-6 h-6 ${activeSosAlert
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'text-rose-600 dark:text-rose-400'
                            }`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{sosStatusTitle}</h3>
                        <p className={`text-sm ${activeSosAlert
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}>{sosStatusMessage}</p>
                    </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-100 dark:border-rose-900/30">
                    <h3 className="font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> Emergency
                    </h3>
                    <p className="text-rose-600/80 dark:text-rose-300/60 text-sm mb-4">
                        Quick access to emergency support.
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        <button className="bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 py-2 px-3 rounded-xl text-sm font-semibold shadow-sm border border-rose-100 dark:border-rose-900 flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" /> 102
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-medium text-emerald-50">Current Vitals Status</span>
                            </div>
                            <h3 className="text-4xl font-bold mb-2">{vitalsStatus.title}</h3>
                            <p className="text-emerald-100">{vitalsStatus.subtitle}</p>
                        </div>
                        <Heart className="absolute -bottom-8 -right-8 w-64 h-64 text-white opacity-10" />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <UserRound className="w-5 h-5 text-emerald-500" />
                                Linked Patient Summary
                            </h3>
                            <span className="text-sm text-slate-500">{loading ? 'Loading...' : 'Live patient profile data'}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {patientSummary.map((item) => (
                                <div key={item.label} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Current Health Snapshot</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {vitalsCards.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div key={item.label} className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-500" /> Care Access
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Linked Patient</p>
                                <p className="font-bold text-slate-900 dark:text-white">{patientName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Relation</p>
                                <p className="font-bold text-slate-900 dark:text-white">{relationLabel}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Access Level</p>
                                <p className="font-bold text-slate-900 dark:text-white">{accessLevel}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-emerald-500" />
                            Contact & Location
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{patientPhone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{patientAddress}</p>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl h-32 flex items-center justify-center text-slate-400">
                                <MapPin className="w-8 h-8 mr-2" />
                                <span>Map unavailable</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default FamilyDashboard;
