import { useEffect, useMemo, useState } from 'react';
import { Heart, Activity, Droplet, Stethoscope } from 'lucide-react';

import { predictSafetyStatus } from '../services/seniorSafetyApi';
import { getWeeklyAverageVitals, roundAverage } from '../utils/patientData';

const API_BASE_URL = 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 12000;

type DailyHealthLog = {
  _id?: string;
  log_date?: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  fasting_blood_glucose?: number;
  post_prandial_glucose?: number;
  o2_saturation?: number;
};

type PatientProfile = {
  _id?: string;
  user_id?: string;
  age?: number | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  cholesterol?: number | null;
  has_bp?: boolean | null;
  has_diabetes?: boolean | null;
  has_cardiac_history?: boolean | null;
};

type MlPredictionResponse = {
  prediction: 'normal' | 'warning' | 'emergency';
  personalized_baseline: {
    sbp: number;
    dbp: number;
    hr: number;
    o2_saturation: number;
    fbs: number;
    ppbs: number;
    cholesterol: number;
  };
};

type MetricStatusMap = {
  heartRate: string;
  bloodPressure: string;
  bloodGlucose: string;
  oxygenLevel: string;
};

interface QuickStatsProps {
  patientId?: string | null;
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
      throw new Error('Request timed out. Please check that the backend and database are running.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function calculateBmi(weight?: number | null, height?: number | null) {
  if (!weight || !height || height <= 0) {
    return null;
  }

  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

function formatMlStatus(status?: string) {
  if (!status) {
    return 'No data';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function QuickStats({ patientId }: QuickStatsProps) {
  const [logs, setLogs] = useState<DailyHealthLog[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricStatuses, setMetricStatuses] = useState<MetricStatusMap>({
    heartRate: 'No data',
    bloodPressure: 'No data',
    bloodGlucose: 'No data',
    oxygenLevel: 'No data'
  });

  useEffect(() => {
    const loadQuickStatsData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLogs([]);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const logsUrl = patientId
          ? `${API_BASE_URL}/daily_health_logs?patient_id=${encodeURIComponent(patientId)}`
          : `${API_BASE_URL}/daily_health_logs`;

        const [logsData, profileData] = await Promise.all([
          requestJson(logsUrl, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          requestJson(patientId ? `${API_BASE_URL}/patients` : `${API_BASE_URL}/patients/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        setLogs(Array.isArray(logsData) ? (logsData as DailyHealthLog[]) : []);
        if (patientId && Array.isArray(profileData)) {
          const matchedProfile =
            (profileData as PatientProfile[]).find((entry) => entry._id === patientId)
            || (profileData as Array<PatientProfile & { user_id?: string }>).find((entry) => entry.user_id === patientId)
            || null;
          setProfile(matchedProfile);
        } else {
          setProfile((profileData as PatientProfile | null) ?? null);
        }
      } catch (error) {
        console.error('Failed to load weekly quick stats:', error);
        setLogs([]);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadQuickStatsData();
  }, [patientId]);

  const weeklyMetrics = useMemo(() => {
    const {
      weeklyLogs,
      averageHeartRate,
      averageSystolic,
      averageDiastolic,
      averageGlucose,
      averageOxygen,
    } = getWeeklyAverageVitals(logs);

    const averageFbs = roundAverage(
      weeklyLogs
        .map((log) => log.fasting_blood_glucose)
        .filter((value): value is number => typeof value === 'number')
    );
    const averagePpbs = roundAverage(
      weeklyLogs
        .map((log) => log.post_prandial_glucose)
        .filter((value): value is number => typeof value === 'number')
    );
    const weeklySummary = weeklyLogs.length === 1 ? '1 entry this week' : `${weeklyLogs.length} entries this week`;

    return {
      weeklyLogs,
      averageHeartRate,
      averageSystolic,
      averageDiastolic,
      averageGlucose,
      averageOxygen,
      averageFbs,
      averagePpbs,
      weeklySummary
    };
  }, [logs]);

  useEffect(() => {
    const runMetricPredictions = async () => {
      if (loading) {
        return;
      }

      const age = profile?.age ?? null;
      const gender = profile?.gender ?? null;
      const weight = profile?.weight ?? null;
      const bmi = profile?.bmi ?? calculateBmi(weight, profile?.height);
      const cholesterol = profile?.cholesterol ?? null;

      const requiredValues = [
        age,
        gender,
        weight,
        bmi,
        cholesterol,
        weeklyMetrics.averageHeartRate,
        weeklyMetrics.averageSystolic,
        weeklyMetrics.averageDiastolic,
        weeklyMetrics.averageOxygen,
        weeklyMetrics.averageFbs,
        weeklyMetrics.averagePpbs
      ];

      if (requiredValues.some((value) => value === null || value === undefined || value === '')) {
        setMetricStatuses({
          heartRate: 'No data',
          bloodPressure: 'No data',
          bloodGlucose: 'No data',
          oxygenLevel: 'No data'
        });
        return;
      }

      try {
        const basePayload = {
          patient_id: profile?._id,
          age: Number(age),
          gender: String(gender),
          weight: Number(weight),
          bmi: Number(bmi),
          cholesterol: Number(cholesterol),
          has_hypertension: Boolean(profile?.has_bp),
          has_diabetes: Boolean(profile?.has_diabetes),
          has_cardiac_history: Boolean(profile?.has_cardiac_history)
        };

        const overallPrediction = await predictSafetyStatus({
          patient_id: basePayload.patient_id ?? undefined,
          age: basePayload.age,
          gender: basePayload.gender,
          weight: basePayload.weight,
          bmi: basePayload.bmi,
          o2_saturation: Number(weeklyMetrics.averageOxygen),
          hr: Number(weeklyMetrics.averageHeartRate),
          sbp: Number(weeklyMetrics.averageSystolic),
          dbp: Number(weeklyMetrics.averageDiastolic),
          fbs: Number(weeklyMetrics.averageFbs),
          ppbs: Number(weeklyMetrics.averagePpbs),
          cholesterol: basePayload.cholesterol,
          has_hypertension: basePayload.has_hypertension,
          has_diabetes: basePayload.has_diabetes,
          has_cardiac_history: basePayload.has_cardiac_history
        }) as MlPredictionResponse;

        const baseline = overallPrediction.personalized_baseline;

        const [heartRateResult, bloodPressureResult, bloodGlucoseResult, oxygenResult] = await Promise.all([
          predictSafetyStatus({
            patient_id: basePayload.patient_id ?? undefined,
            age: basePayload.age,
            gender: basePayload.gender,
            weight: basePayload.weight,
            bmi: basePayload.bmi,
            o2_saturation: baseline.o2_saturation,
            hr: Number(weeklyMetrics.averageHeartRate),
            sbp: baseline.sbp,
            dbp: baseline.dbp,
            fbs: baseline.fbs,
            ppbs: baseline.ppbs,
            cholesterol: baseline.cholesterol,
            has_hypertension: basePayload.has_hypertension,
            has_diabetes: basePayload.has_diabetes,
            has_cardiac_history: basePayload.has_cardiac_history
          }),
          predictSafetyStatus({
            patient_id: basePayload.patient_id ?? undefined,
            age: basePayload.age,
            gender: basePayload.gender,
            weight: basePayload.weight,
            bmi: basePayload.bmi,
            o2_saturation: baseline.o2_saturation,
            hr: baseline.hr,
            sbp: Number(weeklyMetrics.averageSystolic),
            dbp: Number(weeklyMetrics.averageDiastolic),
            fbs: baseline.fbs,
            ppbs: baseline.ppbs,
            cholesterol: baseline.cholesterol,
            has_hypertension: basePayload.has_hypertension,
            has_diabetes: basePayload.has_diabetes,
            has_cardiac_history: basePayload.has_cardiac_history
          }),
          predictSafetyStatus({
            patient_id: basePayload.patient_id ?? undefined,
            age: basePayload.age,
            gender: basePayload.gender,
            weight: basePayload.weight,
            bmi: basePayload.bmi,
            o2_saturation: baseline.o2_saturation,
            hr: baseline.hr,
            sbp: baseline.sbp,
            dbp: baseline.dbp,
            fbs: Number(weeklyMetrics.averageFbs),
            ppbs: Number(weeklyMetrics.averagePpbs),
            cholesterol: baseline.cholesterol,
            has_hypertension: basePayload.has_hypertension,
            has_diabetes: basePayload.has_diabetes,
            has_cardiac_history: basePayload.has_cardiac_history
          }),
          predictSafetyStatus({
            patient_id: basePayload.patient_id ?? undefined,
            age: basePayload.age,
            gender: basePayload.gender,
            weight: basePayload.weight,
            bmi: basePayload.bmi,
            o2_saturation: Number(weeklyMetrics.averageOxygen),
            hr: baseline.hr,
            sbp: baseline.sbp,
            dbp: baseline.dbp,
            fbs: baseline.fbs,
            ppbs: baseline.ppbs,
            cholesterol: baseline.cholesterol,
            has_hypertension: basePayload.has_hypertension,
            has_diabetes: basePayload.has_diabetes,
            has_cardiac_history: basePayload.has_cardiac_history
          })
        ]);

        setMetricStatuses({
          heartRate: formatMlStatus((heartRateResult as MlPredictionResponse).prediction),
          bloodPressure: formatMlStatus((bloodPressureResult as MlPredictionResponse).prediction),
          bloodGlucose: formatMlStatus((bloodGlucoseResult as MlPredictionResponse).prediction),
          oxygenLevel: formatMlStatus((oxygenResult as MlPredictionResponse).prediction)
        });
      } catch (error) {
        console.error('Failed to load ML card statuses:', error);
        setMetricStatuses({
          heartRate: 'No data',
          bloodPressure: 'No data',
          bloodGlucose: 'No data',
          oxygenLevel: 'No data'
        });
      }
    };

    runMetricPredictions();
  }, [loading, profile, weeklyMetrics]);

  const stats = useMemo(() => {
    return [
      {
        label: 'Heart Rate',
        value: weeklyMetrics.averageHeartRate?.toString() || '--',
        unit: 'bpm',
        icon: Heart,
        status: metricStatuses.heartRate,
        trend: '',
        gradient: 'from-emerald-400 to-emerald-600'
      },
      {
        label: 'Blood Pressure',
        value: weeklyMetrics.averageSystolic !== null && weeklyMetrics.averageDiastolic !== null ? `${weeklyMetrics.averageSystolic}/${weeklyMetrics.averageDiastolic}` : '--/--',
        unit: 'mmHg',
        icon: Stethoscope,
        status: metricStatuses.bloodPressure,
        trend: '',
        gradient: 'from-blue-400 to-blue-600'
      },
      {
        label: 'Blood Glucose',
        value: weeklyMetrics.averageGlucose?.toString() || '--',
        unit: 'mg/dL',
        icon: Droplet,
        status: metricStatuses.bloodGlucose,
        trend: '',
        gradient: 'from-cyan-400 to-cyan-600'
      },
      {
        label: 'Oxygen Level',
        value: weeklyMetrics.averageOxygen?.toString() || '--',
        unit: '%',
        icon: Activity,
        status: metricStatuses.oxygenLevel,
        trend: '',
        gradient: 'from-violet-400 to-violet-600'
      },
    ];
  }, [loading, metricStatuses, weeklyMetrics]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isNormal = stat.status === 'Normal';
        const isWarning = stat.status === 'Warning';
        const isEmergency = stat.status === 'Emergency';
        const statusClasses = isNormal
          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800'
          : isWarning
            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800'
            : isEmergency
              ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600';

        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 p-6 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-md`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusClasses}`}>
                {stat.status}
              </span>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-sm font-medium text-slate-400 ml-1.5">{stat.unit}</span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
            {stat.trend ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">{stat.trend}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default QuickStats;
