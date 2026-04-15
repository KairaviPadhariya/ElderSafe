import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clipboard, FileText, Lock, Save, Scale, Thermometer, TrendingUp, User } from 'lucide-react';
import BackButton from '../components/BackButton';

const API_BASE_URL = 'http://127.0.0.1:8000';

type PatientRecord = {
    _id: string;
    name?: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    bmi?: number | null;
    blood_group?: string;
    o2_saturation?: number;
    heart_rate?: number;
    sbp?: number;
    dbp?: number;
    has_bp?: boolean | null;
    has_diabetes?: boolean | null;
    fbs?: number | null;
    ppbs?: number | null;
    cholesterol?: number | null;
};

type FamilyRecord = {
    patient_id?: string;
    patient_name?: string;
};

type DailyLogRecord = {
    log_date: string;
    systolic_bp?: number;
    diastolic_bp?: number;
    heart_rate?: number;
    o2_saturation?: number;
    fasting_blood_glucose?: number;
    post_prandial_glucose?: number;
    weight?: number;
    temperature?: number;
};

type FormData = {
    age: string;
    gender: string;
    height: string;
    weight: string;
    bmi: string;
    bloodGroup: string;
    o2Saturation: string;
    heartRate: string;
    sbp: string;
    dbp: string;
    hasBp: string;
    hasDiabetes: string;
    fbs: string;
    ppbs: string;
    cholesterol: string;
};

const initialFormData: FormData = {
    age: '',
    gender: '',
    height: '',
    weight: '',
    bmi: '',
    bloodGroup: '',
    o2Saturation: '',
    heartRate: '',
    sbp: '120',
    dbp: '80',
    hasBp: '',
    hasDiabetes: '',
    fbs: '',
    ppbs: '',
    cholesterol: ''
};

function toDisplayValue(value?: string | number | null) {
    if (value === undefined || value === null || value === '') {
        return 'Not provided';
    }

    return String(value);
}

function formatGender(value: string) {
    if (!value) {
        return 'Not provided';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}

function booleanToYesNo(value?: boolean | null) {
    if (value === undefined || value === null) {
        return '';
    }

    return value ? 'yes' : 'no';
}

function yesNoToDisplayValue(value: string) {
    if (!value) {
        return 'Not provided';
    }

    return value === 'yes' ? 'Yes' : 'No';
}

function mapPatientToFormData(patient: PatientRecord | null): FormData {
    if (!patient) {
        return {
            ...initialFormData,
            sbp: '',
            dbp: ''
        };
    }

    return {
        age: patient.age !== undefined ? String(patient.age) : '',
        gender: patient.gender || '',
        height: patient.height !== undefined ? String(patient.height) : '',
        weight: patient.weight !== undefined ? String(patient.weight) : '',
        bmi: patient.bmi !== undefined && patient.bmi !== null ? String(patient.bmi) : '',
        bloodGroup: patient.blood_group || '',
        o2Saturation: patient.o2_saturation !== undefined ? String(patient.o2_saturation) : '',
        heartRate: patient.heart_rate !== undefined ? String(patient.heart_rate) : '',
        sbp: patient.sbp !== undefined ? String(patient.sbp) : '',
        dbp: patient.dbp !== undefined ? String(patient.dbp) : '',
        hasBp: booleanToYesNo(patient.has_bp),
        hasDiabetes: booleanToYesNo(patient.has_diabetes),
        fbs: patient.fbs !== undefined && patient.fbs !== null ? String(patient.fbs) : '',
        ppbs: patient.ppbs !== undefined && patient.ppbs !== null ? String(patient.ppbs) : '',
        cholesterol: patient.cholesterol !== undefined && patient.cholesterol !== null ? String(patient.cholesterol) : ''
    };
}

function ReadOnlyTableSection({
    title,
    icon,
    rows
}: {
    title: string;
    icon: JSX.Element;
    rows: Array<{ label: string; value: string }>;
}) {
    return (
        <div className="lg:col-span-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/50">
                <span className="text-emerald-500">{icon}</span>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {rows.map((row) => (
                    <div key={row.label} className="grid grid-cols-1 border-slate-200 dark:border-slate-700 sm:grid-cols-[220px_minmax(0,1fr)]">
                        <div className="bg-slate-50 px-5 py-4 text-sm font-medium text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                            {row.label}
                        </div>
                        <div className="px-5 py-4 text-sm text-slate-800 dark:text-slate-100">
                            {row.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FamilyQuickCard({
    title,
    description,
    buttonLabel,
    accentClass,
    icon,
    onClick
}: {
    title: string;
    description: string;
    buttonLabel: string;
    accentClass: string;
    icon: JSX.Element;
    onClick: () => void;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900/40">
            <div className={`mb-4 inline-flex rounded-2xl p-3 ${accentClass}`}>
                {icon}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            <button
                type="button"
                onClick={onClick}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
                {buttonLabel}
            </button>
        </div>
    );
}

function MedicalDetails() {
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole') || 'patient';
    const isFamilyView = role === 'family';
    const [showFamilyPatientInfo, setShowFamilyPatientInfo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [patientLoading, setPatientLoading] = useState(!isFamilyView);
    const [familyLoading, setFamilyLoading] = useState(isFamilyView);
    const [hasSavedProfile, setHasSavedProfile] = useState(false);
    const [latestDailyLogDate, setLatestDailyLogDate] = useState('');
    const [error, setError] = useState('');
    const [linkedPatientName, setLinkedPatientName] = useState('');
    const [formData, setFormData] = useState<FormData>(initialFormData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (isFamilyView) {
            return;
        }

        if (formData.height && formData.weight) {
            const heightInMeters = parseFloat(formData.height) / 100;
            const weightInKg = parseFloat(formData.weight);

            if (heightInMeters > 0 && weightInKg > 0) {
                const calculatedBmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
                setFormData((prev) => ({ ...prev, bmi: calculatedBmi }));
            }
        } else {
            setFormData((prev) => ({ ...prev, bmi: '' }));
        }
    }, [formData.height, formData.weight, isFamilyView]);

    useEffect(() => {
        if (isFamilyView) {
            return;
        }

        const loadPatientProfile = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Please log in again to continue.');
                setPatientLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/patients/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const responseText = await response.text();
                const responseData = responseText ? JSON.parse(responseText) as PatientRecord | { detail?: string } | null : null;

                if (!response.ok) {
                    throw new Error((responseData as { detail?: string } | null)?.detail || 'Failed to load medical details.');
                }

                const patientData =
                    responseData && !('detail' in (responseData as Record<string, unknown>))
                        ? responseData as PatientRecord
                        : null;

                setError('');
                setHasSavedProfile(Boolean(patientData));
                setFormData(mapPatientToFormData(patientData));
            } catch (loadError) {
                console.error('Failed to load patient medical details:', loadError);
                setError(loadError instanceof Error ? loadError.message : 'Unable to load medical details.');
                setHasSavedProfile(false);
                setFormData({ ...initialFormData, sbp: '', dbp: '' });
            } finally {
                setPatientLoading(false);
            }
        };

        loadPatientProfile();
    }, [isFamilyView]);

    useEffect(() => {
        if ((!isFamilyView && patientLoading) || (isFamilyView && familyLoading)) {
            return;
        }

        const loadLatestDailyLog = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                return;
            }

            try {
                let dailyLogsUrl = `${API_BASE_URL}/daily_health_logs`;

                if (isFamilyView) {
                    const familyResponse = await fetch(`${API_BASE_URL}/family/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    const familyText = await familyResponse.text();
                    const familyData = familyText ? JSON.parse(familyText) as FamilyRecord | null : null;

                    if (!familyResponse.ok) {
                        throw new Error((familyData as { detail?: string } | null)?.detail || 'Failed to load family profile.');
                    }

                    if (familyData?.patient_id) {
                        dailyLogsUrl = `${API_BASE_URL}/daily_health_logs?patient_id=${encodeURIComponent(familyData.patient_id)}`;
                    }
                }

                const response = await fetch(dailyLogsUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const responseText = await response.text();
                const responseData = responseText ? JSON.parse(responseText) as DailyLogRecord[] | { detail?: string } | null : null;

                if (!response.ok) {
                    throw new Error((responseData as { detail?: string } | null)?.detail || 'Failed to load daily health logs.');
                }

                const latestLog = Array.isArray(responseData) && responseData.length > 0 ? responseData[0] : null;

                if (!latestLog) {
                    setLatestDailyLogDate('');
                    return;
                }

                setLatestDailyLogDate(latestLog.log_date || '');
                setFormData((prev) => ({
                    ...prev,
                    weight: latestLog.weight !== undefined && latestLog.weight !== null ? String(latestLog.weight) : prev.weight,
                    o2Saturation: latestLog.o2_saturation !== undefined && latestLog.o2_saturation !== null ? String(latestLog.o2_saturation) : prev.o2Saturation,
                    heartRate: latestLog.heart_rate !== undefined && latestLog.heart_rate !== null ? String(latestLog.heart_rate) : prev.heartRate,
                    sbp: latestLog.systolic_bp !== undefined && latestLog.systolic_bp !== null ? String(latestLog.systolic_bp) : prev.sbp,
                    dbp: latestLog.diastolic_bp !== undefined && latestLog.diastolic_bp !== null ? String(latestLog.diastolic_bp) : prev.dbp,
                    fbs: latestLog.fasting_blood_glucose !== undefined && latestLog.fasting_blood_glucose !== null ? String(latestLog.fasting_blood_glucose) : prev.fbs,
                    ppbs: latestLog.post_prandial_glucose !== undefined && latestLog.post_prandial_glucose !== null ? String(latestLog.post_prandial_glucose) : prev.ppbs
                }));
            } catch (loadError) {
                console.error('Failed to load latest daily health log:', loadError);
            }
        };

        loadLatestDailyLog();
    }, [familyLoading, isFamilyView, patientLoading]);

    useEffect(() => {
        if (!isFamilyView) {
            return;
        }

        const loadLinkedPatient = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Please log in again to view the linked patient details.');
                setFamilyLoading(false);
                return;
            }

            try {
                const [familyResponse, patientsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/family/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch(`${API_BASE_URL}/patients`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);

                const familyText = await familyResponse.text();
                const patientsText = await patientsResponse.text();
                const familyData = familyText ? JSON.parse(familyText) as FamilyRecord | null : null;
                const patientsData = patientsText ? JSON.parse(patientsText) as PatientRecord[] : [];

                if (!familyResponse.ok) {
                    throw new Error((familyData as { detail?: string } | null)?.detail || 'Failed to load family profile.');
                }

                if (!patientsResponse.ok) {
                    throw new Error('Failed to load patients.');
                }

                if (!familyData) {
                    setError('Complete the family profile first to link this dashboard to a patient.');
                    setFormData(mapPatientToFormData(null));
                    setShowFamilyPatientInfo(false);
                    return;
                }

                const matchedPatient =
                    patientsData.find((patient) => patient._id === familyData.patient_id) ||
                    patientsData.find((patient) => patient.name === familyData.patient_name) ||
                    null;

                setLinkedPatientName(matchedPatient?.name || familyData.patient_name || '');
                setFormData(mapPatientToFormData(matchedPatient));
                setShowFamilyPatientInfo(false);
                setError(matchedPatient ? '' : 'The linked patient record could not be found in the database.');
            } catch (loadError) {
                console.error('Failed to load linked patient medical details:', loadError);
                setError(loadError instanceof Error ? loadError.message : 'Unable to load linked patient details.');
                setFormData(mapPatientToFormData(null));
                setShowFamilyPatientInfo(false);
            } finally {
                setFamilyLoading(false);
            }
        };

        loadLinkedPatient();
    }, [isFamilyView]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const name = localStorage.getItem('userName') || 'Patient';

            if (!token) {
                throw new Error('Please log in again to continue.');
            }

            const response = await fetch(`${API_BASE_URL}/patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    age: Number(formData.age),
                    gender: formData.gender,
                    height: Number(formData.height),
                    weight: Number(formData.weight),
                    bmi: formData.bmi ? Number(formData.bmi) : null,
                    blood_group: formData.bloodGroup,
                    o2_saturation: formData.o2Saturation ? Number(formData.o2Saturation) : null,
                    heart_rate: formData.heartRate ? Number(formData.heartRate) : null,
                    sbp: formData.sbp ? Number(formData.sbp) : null,
                    dbp: formData.dbp ? Number(formData.dbp) : null,
                    has_bp: formData.hasBp ? formData.hasBp === 'yes' : null,
                    has_diabetes: formData.hasDiabetes ? formData.hasDiabetes === 'yes' : null,
                    fbs: formData.fbs ? Number(formData.fbs) : null,
                    ppbs: formData.ppbs ? Number(formData.ppbs) : null,
                    cholesterol: formData.cholesterol ? Number(formData.cholesterol) : null,
                })
            });

            const responseText = await response.text();
            const responseData = responseText ? JSON.parse(responseText) : null;

            if (!response.ok) {
                throw new Error(responseData?.detail || 'Failed to save medical details.');
            }

            setHasSavedProfile(true);
            setLoading(false);
            navigate('/dashboard');
        } catch (submitError) {
            console.error('Failed to save medical details:', submitError);
            setLoading(false);
            setError(submitError instanceof Error ? submitError.message : 'Unable to save medical details.');
        }
    };

    const pageTitle = isFamilyView ? 'Patient Overview' : hasSavedProfile ? 'Saved Medical Profile' : 'Medical Profile';
    const pageDescription = isFamilyView
        ? `Viewing ${linkedPatientName || 'the linked patient'}'s medical details in read-only mode.`
        : hasSavedProfile
            ? 'Your medical details are already saved and only need to be provided once.'
            : 'Please provide your medical details to help us personalize your health monitoring.';
    const personalRows = [
        { label: 'Age', value: toDisplayValue(formData.age) },
        { label: 'Gender', value: formatGender(formData.gender) },
        { label: 'Blood Group', value: toDisplayValue(formData.bloodGroup) },
        { label: 'Height (cm)', value: toDisplayValue(formData.height) },
        { label: 'Weight (kg)', value: toDisplayValue(formData.weight) }
    ];
    const vitalsRows = [
        { label: 'BMI', value: toDisplayValue(formData.bmi) },
        { label: 'O2 Saturation (%)', value: toDisplayValue(formData.o2Saturation) },
        { label: 'Heart Rate (bpm)', value: toDisplayValue(formData.heartRate) },
        { label: 'SBP (mmHg)', value: toDisplayValue(formData.sbp) },
        { label: 'DBP (mmHg)', value: toDisplayValue(formData.dbp) }
    ];
    const clinicalRows = [
        { label: 'Blood Pressure', value: yesNoToDisplayValue(formData.hasBp) },
        { label: 'Diabetes', value: yesNoToDisplayValue(formData.hasDiabetes) },
        { label: 'Fasting Blood Sugar', value: toDisplayValue(formData.fbs) },
        { label: 'Post-Prandial Sugar', value: toDisplayValue(formData.ppbs) },
        { label: 'Cholesterol', value: toDisplayValue(formData.cholesterol) }
    ];
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <BackButton />
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-10 text-center">
                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-lg">
                            {isFamilyView ? <Lock className="w-8 h-8 text-white" /> : <Clipboard className="w-8 h-8 text-white" />}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{pageTitle}</h2>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">{pageDescription}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 sm:p-12">
                        {error && (
                            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        {isFamilyView && (
                            <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                <Lock className="w-4 h-4" />
                                Family members can review the linked patient's information here, but cannot edit it.
                            </div>
                        )}

                        {latestDailyLogDate && (
                            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                Latest daily vitals shown below are from {latestDailyLogDate}.
                            </div>
                        )}

                        {isFamilyView && !familyLoading && (
                            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                                <FamilyQuickCard
                                    title="Patient Info"
                                    description={`Review ${linkedPatientName || 'the linked patient'}'s medical profile and current health information on this page.`}
                                    buttonLabel="View Patient Info"
                                    accentClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    icon={<User className="h-6 w-6" />}
                                    onClick={() => setShowFamilyPatientInfo(true)}
                                />
                                <FamilyQuickCard
                                    title="Medical Documents"
                                    description="View uploaded prescriptions and reports for the linked patient, or upload a new file for record keeping."
                                    buttonLabel="Open Documents"
                                    accentClass="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                                    icon={<FileText className="h-6 w-6" />}
                                    onClick={() => navigate('/medical-history')}
                                />
                                <FamilyQuickCard
                                    title="Health Trends"
                                    description="See the linked patient's saved health logs and review trends across blood pressure, glucose, oxygen, and temperature."
                                    buttonLabel="View Health Trends"
                                    accentClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                    icon={<TrendingUp className="h-6 w-6" />}
                                    onClick={() => navigate('/health-trends')}
                                />
                            </div>
                        )}

                        {familyLoading || patientLoading ? (
                            <div className="flex justify-center py-16">
                                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                            </div>
                        ) : isFamilyView && !showFamilyPatientInfo ? null : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {isFamilyView || hasSavedProfile ? (
                                    <>
                                        <ReadOnlyTableSection
                                            title="Personal Information"
                                            icon={<User className="w-5 h-5" />}
                                            rows={personalRows}
                                        />
                                        <ReadOnlyTableSection
                                            title="Vital Metrics"
                                            icon={<Activity className="w-5 h-5" />}
                                            rows={vitalsRows}
                                        />
                                        <ReadOnlyTableSection
                                            title="Clinical Measurements"
                                            icon={<Thermometer className="w-5 h-5" />}
                                            rows={clinicalRows}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className="lg:col-span-3 pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <User className="w-5 h-5 text-emerald-500" />
                                                Personal Information
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Age</label>
                                            <input type="number" name="age" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none" placeholder="Years" value={formData.age} onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                                            <select name="gender" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none" value={formData.gender} onChange={handleChange}>
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Blood Group</label>
                                            <select name="bloodGroup" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none" value={formData.bloodGroup} onChange={handleChange}>
                                                <option value="">Select Group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
                                            <div className="relative">
                                                <input type="number" name="height" step="0.1" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11" placeholder="175" value={formData.height} onChange={handleChange} />
                                                <Scale className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
                                            <div className="relative">
                                                <input type="number" name="weight" step="0.1" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11" placeholder="70.5" value={formData.weight} onChange={handleChange} />
                                                <Scale className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!isFamilyView && !hasSavedProfile && (
                                    <>
                                        <div className="lg:col-span-3 pb-2 border-b border-slate-100 dark:border-slate-700 mb-2 mt-4">
                                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <Thermometer className="w-5 h-5 text-emerald-500" />
                                                Clinical Measurements
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Blood Pressure</label>
                                            <select name="hasBp" required={!hasSavedProfile} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none" value={formData.hasBp} onChange={handleChange}>
                                                <option value="">Select answer</option>
                                                <option value="yes">Yes</option>
                                                <option value="no">No</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Diabetes</label>
                                            <select name="hasDiabetes" required={!hasSavedProfile} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none" value={formData.hasDiabetes} onChange={handleChange}>
                                                <option value="">Select answer</option>
                                                <option value="yes">Yes</option>
                                                <option value="no">No</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fasting Blood Sugar</label>
                                            <input type="number" name="fbs" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none" placeholder="Before meal (mg/dL)" value={formData.fbs} onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Post-Prandial Sugar</label>
                                            <input type="number" name="ppbs" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none" placeholder="2hr after meal (mg/dL)" value={formData.ppbs} onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cholesterol</label>
                                            <input type="number" name="cholesterol" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none" placeholder="Total (mg/dL)" value={formData.cholesterol} onChange={handleChange} />
                                        </div>
                                    </>
                                )}

                            </div>
                        )}

                        <div className="mt-12 flex items-center justify-end gap-4">
                            {!isFamilyView && !hasSavedProfile && (
                                <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" disabled={loading}>
                                    Skip for now
                                </button>
                            )}
                            {!isFamilyView && !hasSavedProfile && (
                                <button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Medical Details
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default MedicalDetails;
