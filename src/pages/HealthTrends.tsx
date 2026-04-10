<<<<<<< HEAD

import { TrendingUp } from 'lucide-react';
import BackButton from '../components/BackButton';

function HealthTrends() {
=======
import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Droplets, Heart, TrendingUp, Weight } from 'lucide-react';

import BackButton from '../components/BackButton';

const API_BASE_URL = 'http://127.0.0.1:8000';
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

function formatDateLabel(date: string) {
    const parsed = new Date(`${date}T00:00:00`);
    return parsed.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
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

function MultiLineChartCard({ title, subtitle, icon: Icon, points, emptyMessage }: MultiLineChartCardProps) {
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

    const metricSeries = points.reduce<Record<string, { color: string; values: Array<{ x: number; y: number; raw: number; label: string }> }>>((accumulator, point, pointIndex) => {
        point.values.forEach((metric) => {
            if (!accumulator[metric.label]) {
                accumulator[metric.label] = {
                    color: metric.color,
                    values: []
                };
            }

            const x = leftPadding + (points.length === 1 ? usableWidth / 2 : (pointIndex / (points.length - 1)) * usableWidth);
            const y = topPadding + ((maxValue - metric.value) / range) * usableHeight;
            accumulator[metric.label].values.push({
                x,
                y,
                raw: metric.value,
                label: point.label
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
                    <div className="overflow-x-auto">
                        <div className="min-w-[760px]">
                            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[300px]">
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
                                    const x = leftPadding + (points.length === 1 ? usableWidth / 2 : (index / (points.length - 1)) * usableWidth);
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
    const role = localStorage.getItem('userRole') || 'patient';
    const isFamilyView = role === 'family';
    const [entries, setEntries] = useState<DailyLogResponse[]>([]);
    const [linkedPatientName, setLinkedPatientName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadLogs = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to view health trends.');
            setLoading(false);
            return;
        }

        try {
            if (isFamilyView) {
                const familyData = await requestJson(`${API_BASE_URL}/family/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setLinkedPatientName((familyData as FamilyRecord | null)?.patient_name || '');
            }

            const logs = await requestJson(`${API_BASE_URL}/daily_health_logs`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const normalizedLogs = Array.isArray(logs) ? (logs as DailyLogResponse[]) : [];
            normalizedLogs.sort((left, right) => left.log_date.localeCompare(right.log_date));
            setEntries(normalizedLogs);
            setError('');
        } catch (loadError) {
            console.error('Failed to load health trends:', loadError);
            setError(loadError instanceof Error ? loadError.message : 'Unable to load health trend data.');
        } finally {
            setLoading(false);
        }
    }, [isFamilyView]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const chartData = useMemo(() => {
        const bloodPressure = entries.map((entry) => ({
            label: formatDateLabel(entry.log_date),
            values: [
                { label: 'Systolic', value: entry.systolic_bp, color: '#10b981' },
                { label: 'Diastolic', value: entry.diastolic_bp, color: '#0f766e' }
            ]
        }));

        const heartAndOxygen = entries
            .filter((entry) => entry.o2_saturation != null)
            .map((entry) => ({
                label: formatDateLabel(entry.log_date),
                values: [
                    { label: 'Heart Rate', value: entry.heart_rate, color: '#ef4444' },
                    { label: 'Oxygen', value: entry.o2_saturation as number, color: '#3b82f6' }
                ]
            }));

        const glucose = entries
            .filter((entry) => entry.fasting_blood_glucose != null || entry.post_prandial_glucose != null)
            .map((entry) => ({
                label: formatDateLabel(entry.log_date),
                values: [
                    ...(entry.fasting_blood_glucose != null
                        ? [{ label: 'Fasting', value: entry.fasting_blood_glucose, color: '#8b5cf6' }]
                        : []),
                    ...(entry.post_prandial_glucose != null
                        ? [{ label: 'Post-Meal', value: entry.post_prandial_glucose, color: '#f59e0b' }]
                        : [])
                ]
            }));

        const bodyMetrics = entries
            .filter((entry) => entry.weight != null || entry.temperature != null)
            .map((entry) => ({
                label: formatDateLabel(entry.log_date),
                values: [
                    ...(entry.weight != null ? [{ label: 'Weight', value: entry.weight, color: '#14b8a6' }] : []),
                    ...(entry.temperature != null ? [{ label: 'Temperature', value: entry.temperature, color: '#f97316' }] : [])
                ]
            }));

        return {
            bloodPressure,
            heartAndOxygen,
            glucose,
            bodyMetrics
        };
    }, [entries]);

    const latestEntry = entries.length > 0 ? entries[entries.length - 1] : undefined;
    const pageSubtitle = isFamilyView
        ? `Visualizing previous logged data for ${linkedPatientName || 'the linked patient'}`
        : 'Visualizing your vital metrics over time';
>>>>>>> hima

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <BackButton />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                        Health Trends
                    </h1>
<<<<<<< HEAD
                    <p className="text-slate-500 dark:text-slate-400">Visualizing your vital metrics over time</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Placeholder Charts */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center min-h-[300px]">
                            <p className="text-slate-400 font-medium">Chart Placeholder {i}</p>
                        </div>
                    ))}
                </div>
=======
                    <p className="text-slate-500 dark:text-slate-400">{pageSubtitle}</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                        {error}
                    </div>
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
                            title="Weight And Temperature"
                            subtitle="Body metrics captured in previous daily logs"
                            icon={Weight}
                            points={chartData.bodyMetrics}
                            emptyMessage="Add weight or temperature entries to see this chart."
                        />
                    </div>
                )}
>>>>>>> hima
            </div>
        </div>
    );
}

export default HealthTrends;
