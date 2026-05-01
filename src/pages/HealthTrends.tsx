import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, Droplets, Heart, TrendingUp, Thermometer } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import BackButton from '../components/BackButton';

const DEFAULT_API_BASE_URL = 'http://10.22.60.236:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const API_BASE_URL_CANDIDATES = Array.from(new Set([
  API_BASE_URL,
  DEFAULT_API_BASE_URL,
  'http://10.22.60.236:8000'
].filter(Boolean).map((value) => value.replace(/\/$/, ''))));
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
  cholesterol?: number;
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
  log_date?: string;
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
      throw new Error(`Request timed out for ${url}. Please check that the backend and MongoDB are running.`);
    }

    if (error instanceof TypeError) {
      throw new TypeError(`Failed to fetch ${url}. Check that this address is reachable from the browser.`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function requestJsonWithBaseFallback(path: string, options: RequestInit = {}) {
  let lastError: unknown = null;

  for (const baseUrl of API_BASE_URL_CANDIDATES) {
    try {
      return await requestJson(`${baseUrl}${path}`, options);
    } catch (error) {
      lastError = error;

      if (!(error instanceof TypeError)) {
        throw error;
      }
    }
  }

  if (lastError instanceof Error) {
    throw new Error(
      `Could not connect to the health trends backend. Tried ${API_BASE_URL_CANDIDATES.join(', ')}. ${lastError.message}`
    );
  }

  throw new Error(`Could not connect to the health trends backend. Tried ${API_BASE_URL_CANDIDATES.join(', ')}.`);
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

function getRiskEntryDateKey(entry: RiskHistoryEntry) {
  return entry.log_date || getLocalDateKey(entry.date);
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildRiskCalendarDays(monthDate: Date, logs: DailyLogResponse[], predictions: RiskHistoryEntry[]) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

  const logByDate = new Map(logs.map((log) => [log.log_date, log]));
  const latestEntryByDate = new Map(predictions.map((entry) => [getRiskEntryDateKey(entry), entry]));
  const days: Array<{
    key: string;
    dateNumber: number;
    isCurrentMonth: boolean;
    log?: DailyLogResponse;
    entry?: RiskHistoryEntry;
  }> = [];

  for (let cursor = new Date(calendarStart); cursor <= calendarEnd; cursor.setDate(cursor.getDate() + 1)) {
    const dateKey = getDateKey(cursor);
    days.push({
      key: dateKey,
      dateNumber: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === monthDate.getMonth(),
      log: logByDate.get(dateKey),
      entry: latestEntryByDate.get(dateKey),
    });
  }

  return days;
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
  const [riskCalendarMonth, setRiskCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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
        const familyData = await requestJsonWithBaseFallback('/family/me', {
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

      const query = new URLSearchParams();

      if (isDoctorView && selectedPatientId) {
        query.set('patient_id', selectedPatientId);
      } else if (isFamilyView && (familyPatientId || linkedPatientId)) {
        query.set('patient_id', familyPatientId || linkedPatientId);
      }

      const logsPath = query.toString() ? `/daily_health_logs?${query.toString()}` : '/daily_health_logs';
      const logs = await requestJsonWithBaseFallback(logsPath, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const normalizedLogs = Array.isArray(logs) ? (logs as DailyLogResponse[]) : [];
      normalizedLogs.sort((left, right) => left.log_date.localeCompare(right.log_date));
      setEntries(normalizedLogs);

      const trendsQuery = new URLSearchParams();
      if (isDoctorView && selectedPatientId) {
        trendsQuery.set('patient_id', selectedPatientId);
      } else if (isFamilyView && (familyPatientId || linkedPatientId)) {
        trendsQuery.set('patient_id', familyPatientId || linkedPatientId);
      }

      const trendsPath = trendsQuery.toString() ? `/health_trends?${trendsQuery.toString()}` : '/health_trends';
      const trends = await requestJsonWithBaseFallback(trendsPath, {
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
      const dateKey = getRiskEntryDateKey(entry);

      if (!latestRiskByDay.has(dateKey)) {
        latestRiskByDay.set(dateKey, entry);
      }
    }

    return Array.from(latestRiskByDay.values()).reverse();
  }, [riskHistory]);

  useEffect(() => {
    const latestLog = entries[entries.length - 1];
    const latestPrediction = dailyRiskHistory[dailyRiskHistory.length - 1];
    const preferredDate = latestLog?.log_date || (latestPrediction ? getRiskEntryDateKey(latestPrediction) : '');

    if (!preferredDate) {
      return;
    }

    setRiskCalendarMonth((current) => {
      const preferredMonth = new Date(`${preferredDate}T00:00:00`);
      if (Number.isNaN(preferredMonth.getTime())) {
        return current;
      }

      if (
        current.getFullYear() === preferredMonth.getFullYear()
        && current.getMonth() === preferredMonth.getMonth()
      ) {
        return current;
      }

      return new Date(preferredMonth.getFullYear(), preferredMonth.getMonth(), 1);
    });
  }, [dailyRiskHistory, entries]);

  const riskCalendarDays = useMemo(
    () => buildRiskCalendarDays(riskCalendarMonth, entries, dailyRiskHistory),
    [dailyRiskHistory, entries, riskCalendarMonth]
  );
  const riskMonthValue = String(riskCalendarMonth.getMonth());
  const riskYearValue = String(riskCalendarMonth.getFullYear());
  const visibleMonthLogs = riskCalendarDays.filter((day) => day.isCurrentMonth && day.log).length;
  const visibleMonthPredictions = riskCalendarDays.filter((day) => day.isCurrentMonth && day.entry).length;
  const riskLegend = [
    {
      label: 'Normal',
      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    },
    {
      label: 'Warning',
      classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
    },
    {
      label: 'Emergency',
      classes: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
    }
  ];

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

    const temperature = filteredEntries
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

    const cholesterol = filteredEntries
      .filter((entry) => entry.cholesterol != null)
      .map((entry) => ({
        label: formatDateLabel(entry.log_date),
        values: [
          { label: 'Cholesterol', value: entry.cholesterol as number, color: '#06b6d4' }
        ],
      }));

    return {
      bloodPressure,
      heartAndOxygen,
      glucose,
      temperature,
      cholesterol,
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

            {entries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No daily logs found in the database yet. Save daily logs first, then predictions will appear on this calendar.
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-emerald-500" />
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {riskCalendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Showing {visibleMonthPredictions} predictions from {visibleMonthLogs} saved daily logs in this month.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/50">
                      <button
                        type="button"
                        onClick={() => setRiskCalendarMonth((current) => addMonths(current, -1))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          setRiskCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                        }}
                        className="h-9 rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setRiskCalendarMonth((current) => addMonths(current, 1))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Next month"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <select
                      value={riskMonthValue}
                      onChange={(event) => {
                        setRiskCalendarMonth((current) => new Date(current.getFullYear(), Number(event.target.value), 1));
                      }}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-emerald-900/40"
                      aria-label="Select month"
                    >
                      {Array.from({ length: 12 }, (_, monthIndex) => (
                        <option key={monthIndex} value={monthIndex}>
                          {new Date(2026, monthIndex, 1).toLocaleDateString(undefined, { month: 'long' })}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={riskYearValue}
                      onChange={(event) => {
                        const nextYear = Number(event.target.value);
                        if (nextYear >= 2000 && nextYear <= 2100) {
                          setRiskCalendarMonth((current) => new Date(nextYear, current.getMonth(), 1));
                        }
                      }}
                      className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-emerald-900/40"
                      aria-label="Select year"
                    />
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {riskLegend.map((item) => (
                    <span key={item.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.classes}`}>
                      {item.label}
                    </span>
                  ))}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                    Log saved, prediction pending
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {day}
                    </div>
                  ))}

                  {riskCalendarDays.map((day) => {
                    const isHighConfidenceEmergency = Boolean(
                      day.entry?.prediction === 'emergency' && day.entry.confidence > 0.85
                    );
                    const predictionClasses = !day.log
                      ? 'bg-slate-50 text-slate-300 dark:bg-slate-900/30 dark:text-slate-600'
                      : !day.entry
                        ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-700'
                      : day.entry.prediction === 'emergency'
                        ? isHighConfidenceEmergency
                          ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/50'
                          : 'bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900/50'
                        : day.entry.prediction === 'warning'
                          ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50'
                          : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50';

                    return (
                      <div
                        key={day.key}
                        className={`min-h-[92px] rounded-2xl p-3 ${predictionClasses} ${day.isCurrentMonth ? '' : 'opacity-45'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold">{day.dateNumber}</span>
                          {day.entry ? (
                            <span className="text-[11px] font-bold uppercase tracking-wide">
                              {day.entry.prediction.slice(0, 1)}
                            </span>
                          ) : null}
                        </div>
                        {day.entry ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold">
                              {formatRiskLabel(day.entry.prediction)}
                            </p>
                            <p className="mt-1 text-xs opacity-80">
                              {Math.round(day.entry.confidence * 100)}%
                            </p>
                          </div>
                        ) : day.log ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold">Log saved</p>
                            <p className="mt-1 text-xs opacity-75">Prediction pending</p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
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
              points={chartData.temperature}
              emptyMessage="Add temperature entries to see this chart."
            />
            <MultiLineChartCard
              title="Cholesterol Trends"
              subtitle="Cholesterol recorded in previous daily logs"
              icon={Activity}
              points={chartData.cholesterol}
              emptyMessage="Add cholesterol entries to see this chart."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthTrends;
