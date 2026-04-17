import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Droplets, Heart, TrendingUp, Thermometer } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import BackButton from '../components/BackButton';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 12000;

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

type ChartMetric = {
  label: string;
  value: number;
  color: string;
};

type MultiLineChartCardProps = {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  points: Array<{
    label: string;
    values: ChartMetric[];
  }>;
  emptyMessage: string;
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
      signal: controller.signal,
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

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function calculateTrend(values: number[]) {
  if (values.length < 2) {
    return 'Not enough data';
  }

  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;

  if (Math.abs(delta) < 1) {
    return 'Stable';
  }

  return delta > 0 ? `Up ${delta.toFixed(1)}` : `Down ${Math.abs(delta).toFixed(1)}`;
}

function formatRiskLabel(prediction: RiskHistoryEntry['prediction']) {
  return prediction.charAt(0).toUpperCase() + prediction.slice(1);
}

function getLocalDateKey(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function MultiLineChartCard({
  title,
  subtitle,
  icon: Icon,
  points,
  emptyMessage,
}: MultiLineChartCardProps) {
  const allMetricValues = points.flatMap((point) => point.values.map((metric) => metric.value));
  const minValue = Math.min(...allMetricValues);
  const maxValue = Math.max(...allMetricValues);
  const range = maxValue - minValue || 1;
  const chartWidth = 760;
  const chartHeight = 260;
  const leftPadding = 24;
  const rightPadding = 18;
  const topPadding = 18;
  const bottomPadding = 38;
  const usableWidth = chartWidth - leftPadding - rightPadding;
  const usableHeight = chartHeight - topPadding - bottomPadding;

  const metricSeries = points.reduce<
    Record<string, { color: string; values: Array<{ x: number; y: number; raw: number; label: string }> }>
  >((accumulator, point, pointIndex) => {
    point.values.forEach((metric) => {
      if (!accumulator[metric.label]) {
        accumulator[metric.label] = {
          color: metric.color,
          values: [],
        };
      }

      const x =
        leftPadding + (points.length === 1 ? usableWidth / 2 : (pointIndex / (points.length - 1)) * usableWidth);
      const y = topPadding + ((maxValue - metric.value) / range) * usableHeight;
      accumulator[metric.label].values.push({
        x,
        y,
        raw: metric.value,
        label: point.label,
      });
    });

    return accumulator;
  }, {});

  const latestValues = points.length > 0 ? points[points.length - 1].values : [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
            <Icon className="w-5 h-5 text-emerald-500" />
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Latest</p>
          <div className="mt-1 space-y-1">
            {latestValues.map((metric: ChartMetric) => (
              <p key={metric.label} className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {metric.label}: {metric.value}
              </p>
            ))}
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="min-h-[300px] flex items-center justify-center text-slate-400 dark:text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="w-full">
            <div className="w-full">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                {[0, 1, 2, 3].map((index) => {
                  const y = topPadding + (usableHeight / 3) * index;
                  const value = maxValue - (range / 3) * index;

                  return (
                    <g key={index}>
                      <line
                        x1={leftPadding}
                        y1={y}
                        x2={chartWidth - rightPadding}
                        y2={y}
                        className="stroke-slate-200 dark:stroke-slate-700"
                        strokeDasharray="4 6"
                      />
                      <text
                        x={chartWidth - rightPadding}
                        y={y - 6}
                        textAnchor="end"
                        className="fill-slate-400 dark:fill-slate-500"
                        fontSize="11"
                      >
                        {value.toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {Object.entries(metricSeries).map(([metricName, series]) => (
                  <g key={metricName}>
                    <polyline
                      fill="none"
                      stroke={series.color}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={series.values.map((point) => `${point.x},${point.y}`).join(' ')}
                    />
                    {series.values.map((point) => (
                      <g key={`${metricName}-${point.label}`}>
                        <circle cx={point.x} cy={point.y} r="4.5" fill={series.color} />
                        <title>{`${metricName}: ${point.raw} on ${point.label}`}</title>
                      </g>
                    ))}
                  </g>
                ))}

                {points.map((point, index) => {
                  const x =
                    leftPadding + (points.length === 1 ? usableWidth / 2 : (index / (points.length - 1)) * usableWidth);
                  return (
                    <text
                      key={point.label}
                      x={x}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      className="fill-slate-400 dark:fill-slate-500"
                      fontSize="11"
                    >
                      {point.label}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(metricSeries).map(([metricName, series]) => {
              const seriesValues = series.values.map((point) => point.raw);
              return (
                <div
                  key={metricName}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{metricName}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{calculateTrend(seriesValues)}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function HealthTrends() {
  const [searchParams] = useSearchParams();
  const role = localStorage.getItem('userRole') || 'patient';
  const isFamilyView = role === 'family';
  const isDoctorView = role === 'doctor';
  const selectedPatientId = searchParams.get('patientId') || '';
  const selectedPatientName = searchParams.get('patientName') || '';
  const [entries, setEntries] = useState<DailyLogResponse[]>([]);
  const [linkedPatientName, setLinkedPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState<'weekly' | 'monthly' | 'risk'>('weekly');
  const [riskHistory, setRiskHistory] = useState<RiskHistoryEntry[]>([]);
  const [linkedPatientId, setLinkedPatientId] = useState('');

  const loadLogs = useCallback(async () => {
    const token = localStorage.getItem('token');
    let familyPatientId = '';

    if (!token) {
      setError('Please log in again to view health trends.');
      setLoading(false);
      return;
    }

    try {
      if (isFamilyView) {
        const familyData = await requestJson(`${API_BASE_URL}/family/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const familyRecord = (familyData as FamilyRecord | null) ?? null;
        setLinkedPatientName(familyRecord?.patient_name || '');
        setLinkedPatientId(familyRecord?.patient_id || '');
        familyPatientId = familyRecord?.patient_id || '';
      } else if (isDoctorView) {
        setLinkedPatientName(selectedPatientName);
        setLinkedPatientId('');
      } else {
        setLinkedPatientId('');
      }

      const url = new URL(`${API_BASE_URL}/daily_health_logs`);

      if (isDoctorView && selectedPatientId) {
        url.searchParams.set('patient_id', selectedPatientId);
      } else if (isFamilyView && (familyPatientId || linkedPatientId)) {
        url.searchParams.set('patient_id', familyPatientId || linkedPatientId);
      }

      const logs = await requestJson(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const normalizedLogs = Array.isArray(logs) ? (logs as DailyLogResponse[]) : [];
      normalizedLogs.sort((left, right) => left.log_date.localeCompare(right.log_date));
      setEntries(normalizedLogs);

      const trendsUrl = new URL(`${API_BASE_URL}/health_trends`);
      if (isDoctorView && selectedPatientId) {
        trendsUrl.searchParams.set('patient_id', selectedPatientId);
      } else if (isFamilyView && (familyPatientId || linkedPatientId)) {
        trendsUrl.searchParams.set('patient_id', familyPatientId || linkedPatientId);
      }

      const trends = await requestJson(trendsUrl.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const normalizedTrends = Array.isArray(trends) ? (trends as RiskHistoryEntry[]) : [];
      normalizedTrends.sort((left, right) => left.date.localeCompare(right.date));
      setRiskHistory(normalizedTrends);
      setError('');
    } catch (loadError) {
      console.error('Failed to load health trends:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load health trend data.');
    } finally {
      setLoading(false);
    }
  }, [isDoctorView, isFamilyView, linkedPatientId, selectedPatientId, selectedPatientName]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    const refreshRiskHistory = () => {
      void loadLogs();
    };

    window.addEventListener('ml-history-updated', refreshRiskHistory as EventListener);

    return () => {
      window.removeEventListener('ml-history-updated', refreshRiskHistory as EventListener);
    };
  }, [loadLogs]);

  const dailyRiskHistory = useMemo(() => {
    const latestRiskByDay = new Map<string, RiskHistoryEntry>();

    for (let index = riskHistory.length - 1; index >= 0; index -= 1) {
      const entry = riskHistory[index];
      const dateKey = getLocalDateKey(entry.date);

      if (!latestRiskByDay.has(dateKey)) {
        latestRiskByDay.set(dateKey, entry);
      }
    }

    return Array.from(latestRiskByDay.values()).reverse();
  }, [riskHistory]);

  const filteredEntries = useMemo(() => {
    if (entries.length === 0) return [];
    
    // Find latest date in the entries array
    const latestDateStr = entries[entries.length - 1].log_date;
    // We add T00:00:00 to parse in local time correctly depending on browser, 
    // or just use typical string to Date constructor.
    const latestDate = new Date(`${latestDateStr}T00:00:00`);
    
    const cutoffDate = new Date(latestDate);
    if (selectedView === 'weekly') {
      cutoffDate.setDate(cutoffDate.getDate() - 6);
    } else if (selectedView === 'monthly') {
      cutoffDate.setDate(cutoffDate.getDate() - 29);
    }
    
    return entries.filter(entry => {
      const entryDate = new Date(`${entry.log_date}T00:00:00`);
      return entryDate >= cutoffDate;
    });
  }, [entries, selectedView]);

  const chartData = useMemo(() => {
    const bloodPressure = filteredEntries.map((entry) => ({
      label: formatDateLabel(entry.log_date),
      values: [
        { label: 'Systolic', value: entry.systolic_bp, color: '#10b981' },
        { label: 'Diastolic', value: entry.diastolic_bp, color: '#0f766e' },
      ],
    }));

    const heartAndOxygen = filteredEntries
      .filter((entry) => entry.o2_saturation != null)
      .map((entry) => ({
        label: formatDateLabel(entry.log_date),
        values: [
          { label: 'Heart Rate', value: entry.heart_rate, color: '#ef4444' },
          { label: 'Oxygen', value: entry.o2_saturation as number, color: '#3b82f6' },
        ],
      }));

    const glucose = filteredEntries
      .filter((entry) => entry.fasting_blood_glucose != null || entry.post_prandial_glucose != null)
      .map((entry) => ({
        label: formatDateLabel(entry.log_date),
        values: [
          ...(entry.fasting_blood_glucose != null
            ? [{ label: 'Fasting', value: entry.fasting_blood_glucose, color: '#8b5cf6' }]
            : []),
          ...(entry.post_prandial_glucose != null
            ? [{ label: 'Post-Meal', value: entry.post_prandial_glucose, color: '#f59e0b' }]
            : []),
        ],
      }));

    const bodyMetrics = filteredEntries
      .filter((entry) => entry.temperature != null)
      .map((entry) => {
        let temp = entry.temperature as number;
        // Normalize: before April 10, temperature was recorded in Fahrenheit
        if (entry.log_date < '2026-04-10') {
          // Convert Fahrenheit to Celsius
          temp = (temp - 32) * (5 / 9);
        }
        
        return {
          label: formatDateLabel(entry.log_date),
          values: [
            { label: 'Temperature', value: Number(temp.toFixed(1)), color: '#f97316' }
          ],
        };
      });

    return {
      bloodPressure,
      heartAndOxygen,
      glucose,
      bodyMetrics,
    };
  }, [filteredEntries]);

  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : undefined;
  const pageSubtitle = isDoctorView
    ? `Viewing health trends for ${linkedPatientName || 'the selected patient'}`
    : isFamilyView
      ? `Visualizing previous logged data for ${linkedPatientName || 'the linked patient'}`
      : 'Visualizing your vital metrics over time';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <BackButton />

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              Health Trends
            </h1>
            <p className="text-slate-500 dark:text-slate-400">{pageSubtitle}</p>
          </div>
          <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
            <button
              onClick={() => setSelectedView('weekly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === 'weekly'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedView('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === 'monthly'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedView('risk')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === 'risk'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              Risk Timeline
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Entries</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{entries.length}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Latest Date</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {latestEntry ? latestEntry.log_date : '--'}
            </p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Latest BP</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {latestEntry ? `${latestEntry.systolic_bp}/${latestEntry.diastolic_bp}` : '--'}
            </p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Latest HR</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {latestEntry ? `${latestEntry.heart_rate} bpm` : '--'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            Loading health trends...
          </div>
        ) : selectedView === 'risk' ? (
          <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Risk Timeline
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Recent prediction results tracked alongside your health trends.
                </p>
              </div>
            </div>

            {dailyRiskHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No risk history yet. Refresh the dashboard prediction card to start building a timeline.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {dailyRiskHistory.map((entry) => {
                  const timelineClasses =
                    entry.prediction === 'emergency'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : entry.prediction === 'warning'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';

                  return (
                    <div
                      key={`${entry.date}-${entry.prediction}`}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${timelineClasses}`}
                    >
                      {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {formatRiskLabel(entry.prediction)} {Math.round(entry.confidence * 100)}%
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            No previous health logs found yet. Save a few daily entries and the charts will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <MultiLineChartCard
              title="Blood Pressure"
              subtitle="Systolic and diastolic trends from saved daily logs"
              icon={Heart}
              points={chartData.bloodPressure}
              emptyMessage="No blood pressure records yet."
            />
            <MultiLineChartCard
              title="Heart Rate And Oxygen"
              subtitle="Cardio-respiratory changes across previous entries"
              icon={Activity}
              points={chartData.heartAndOxygen}
              emptyMessage="Add heart rate and oxygen entries to see this chart."
            />
            <MultiLineChartCard
              title="Glucose Trends"
              subtitle="Fasting and post-meal blood sugar readings over time"
              icon={Droplets}
              points={chartData.glucose}
              emptyMessage="Add fasting or post-meal glucose values to see this chart."
            />
            <MultiLineChartCard
              title="Temperature Trends"
              subtitle="Body temperature recorded in previous daily logs"
              icon={Thermometer}
              points={chartData.bodyMetrics}
              emptyMessage="Add temperature entries to see this chart."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthTrends;
