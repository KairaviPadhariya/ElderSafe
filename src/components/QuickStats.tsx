import { useEffect, useMemo, useState } from 'react';
import { Heart, Activity, Droplet, Stethoscope } from 'lucide-react';

import { getWeeklyAverageVitals } from '../utils/patientData';

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

function getMetricStatus(value: number | null, min: number, max: number) {
  if (value === null) {
    return 'No data';
  }

  return value >= min && value <= max ? 'Normal' : 'Review';
}

function QuickStats({ patientId }: QuickStatsProps) {
  const [logs, setLogs] = useState<DailyHealthLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeeklyLogs = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLogs([]);
        setLoading(false);
        return;
      }

      try {
        const url = patientId
          ? `${API_BASE_URL}/daily_health_logs?patient_id=${encodeURIComponent(patientId)}`
          : `${API_BASE_URL}/daily_health_logs`;

        const data = await requestJson(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setLogs(Array.isArray(data) ? (data as DailyHealthLog[]) : []);
      } catch (error) {
        console.error('Failed to load weekly quick stats:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadWeeklyLogs();
  }, [patientId]);

  const stats = useMemo(() => {
    const {
      weeklyLogs,
      averageHeartRate,
      averageSystolic,
      averageDiastolic,
      averageGlucose,
      averageOxygen,
    } = getWeeklyAverageVitals(logs);
    const weeklySummary = weeklyLogs.length === 1 ? '1 entry this week' : `${weeklyLogs.length} entries this week`;

    return [
      {
        label: 'Heart Rate',
        value: averageHeartRate?.toString() || '--',
        unit: 'bpm',
        icon: Heart,
        status: getMetricStatus(averageHeartRate, 60, 100),
        trend: loading ? 'Loading weekly average...' : weeklySummary,
        gradient: 'from-emerald-400 to-emerald-600'
      },
      {
        label: 'Blood Pressure',
        value: averageSystolic !== null && averageDiastolic !== null ? `${averageSystolic}/${averageDiastolic}` : '--/--',
        unit: 'mmHg',
        icon: Stethoscope,
        status:
          averageSystolic !== null && averageDiastolic !== null && averageSystolic < 140 && averageDiastolic < 90
            ? 'Normal'
            : averageSystolic === null || averageDiastolic === null
              ? 'No data'
              : 'Review',
        trend: loading ? 'Loading weekly average...' : 'Average of this week',
        gradient: 'from-blue-400 to-blue-600'
      },
      {
        label: 'Blood Glucose',
        value: averageGlucose?.toString() || '--',
        unit: 'mg/dL',
        icon: Droplet,
        status: getMetricStatus(averageGlucose, 70, 140),
        trend: loading ? 'Loading weekly average...' : 'Average of this week',
        gradient: 'from-cyan-400 to-cyan-600'
      },
      {
        label: 'Oxygen Level',
        value: averageOxygen?.toString() || '--',
        unit: '%',
        icon: Activity,
        status: averageOxygen === null ? 'No data' : averageOxygen >= 95 ? 'Normal' : 'Review',
        trend: loading ? 'Loading weekly average...' : averageOxygen === null ? 'No oxygen logs this week' : 'Average of this week',
        gradient: 'from-violet-400 to-violet-600'
      },
    ];
  }, [loading, logs]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isNormal = stat.status === 'Normal';
        const isReview = stat.status === 'Review';
        const statusClasses = isNormal
          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800'
          : isReview
            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800'
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
            <p className="text-xs text-slate-400 dark:text-slate-500">{stat.trend}</p>
          </div>
        );
      })}
    </div>
  );
}

export default QuickStats;
