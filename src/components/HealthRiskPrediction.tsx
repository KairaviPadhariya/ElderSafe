import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Loader2, ShieldAlert, Siren } from 'lucide-react';

import { predictSafetyStatus } from '../services/seniorSafetyApi';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 12000;
const AUTO_SOS_CONFIDENCE_THRESHOLD = 0.85;

type PatientProfile = {
  _id?: string;
  age?: number | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  o2_saturation?: number | null;
  heart_rate?: number | null;
  sbp?: number | null;
  dbp?: number | null;
  has_bp?: boolean | null;
  has_diabetes?: boolean | null;
  has_cardiac_history?: boolean | null;
  fbs?: number | null;
  ppbs?: number | null;
  cholesterol?: number | null;
};

type DailyHealthLog = {
  log_date?: string;
  created_at?: string;
  updated_at?: string;
  weight?: number | null;
  heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  o2_saturation?: number | null;
  fasting_blood_glucose?: number | null;
  post_prandial_glucose?: number | null;
  cholesterol?: number | null;
};

type PredictionResult = {
  prediction: 'normal' | 'warning' | 'emergency';
  model_prediction?: 'normal' | 'warning' | 'emergency';
  rule_based_label: 'normal' | 'warning' | 'emergency';
  probabilities: Record<string, number>;
  personalized_baseline: Record<string, number>;
  alert: {
    status: 'normal' | 'warning' | 'emergency';
    channels: string[];
    confidence: number;
    recommended_action: string;
  };
};

type PredictionPayloadSnapshot = {
  patient_id?: string;
  age: number;
  gender: string;
  weight: number;
  bmi: number;
  o2_saturation: number;
  hr: number;
  sbp: number;
  dbp: number;
  fbs: number;
  ppbs: number;
  cholesterol: number;
  has_hypertension: boolean;
  has_diabetes: boolean;
  has_cardiac_history: boolean;
};

type RiskHistoryEntry = {
  date: string;
  prediction: 'normal' | 'warning' | 'emergency';
  confidence: number;
};

interface HealthRiskPredictionProps {
  patientId?: string | null;
  patientName?: string;
  allowAutoSos?: boolean;
  heading?: string;
  hideRecommendedAction?: boolean;
  hideAlertChannels?: boolean;
}

async function requestText(url: string, options: RequestInit = {}) {
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
      throw new Error('SOS request timed out. Please check that the backend is running.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
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
      throw new Error('Prediction request timed out. Please check that the backend services are running.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function parseTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = /z$/i.test(value) ? value : `${value}Z`;
  const timestamp = new Date(normalizedValue);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function getLogTimestamp(log: DailyHealthLog) {
  return (
    parseTimestamp(log.updated_at)
    || parseTimestamp(log.created_at)
    || parseTimestamp(log.log_date ? `${log.log_date}T00:00:00` : undefined)
  );
}

function calculateBmi(weight?: number | null, height?: number | null) {
  if (!weight || !height || height <= 0) {
    return null;
  }

  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatChannel(channel: string) {
  return channel
    .split('_')
    .map((part) => toTitleCase(part))
    .join(' ');
}

function getPatientStorageKey(patientId: string | undefined, suffix: string) {
  return `eldersafe-${suffix}-${patientId || 'current-patient'}`;
}

function getCurrentDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function buildLogEventKey(log: DailyHealthLog | undefined) {
  if (!log?.log_date) {
    return '';
  }

  const timestamp =
    getLogTimestamp(log)?.toISOString()
    || parseTimestamp(`${log.log_date}T00:00:00`)?.toISOString()
    || '';

  return `${log.log_date}:${timestamp}`;
}

function getCurrentLocationLabel(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('Location unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve(`Auto-triggered from dashboard prediction at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      () => {
        resolve('Auto-triggered from dashboard prediction');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

function getRiskHistoryKey(patientId?: string) {
  return getPatientStorageKey(patientId, 'risk-history');
}

function readRiskHistory(patientId?: string) {
  try {
    const raw = localStorage.getItem(getRiskHistoryKey(patientId));
    if (!raw) {
      return [] as RiskHistoryEntry[];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as RiskHistoryEntry[] : [];
  } catch {
    return [];
  }
}

function writeRiskHistory(patientId: string | undefined, nextHistory: RiskHistoryEntry[]) {
  localStorage.setItem(getRiskHistoryKey(patientId), JSON.stringify(nextHistory));
  localStorage.setItem(getRiskHistoryKey(undefined), JSON.stringify(nextHistory));
  window.dispatchEvent(new CustomEvent('ml-history-updated'));
}

async function saveRiskHistoryEntry(
  patientId: string,
  entry: RiskHistoryEntry,
  logDate: string
) {
  const token = localStorage.getItem('token');

  if (!token) {
    return;
  }

  await requestJson(`${API_BASE_URL}/health_trends`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      patient_id: patientId,
      prediction: entry.prediction,
      confidence: entry.confidence,
      date: entry.date,
      log_date: logDate || entry.date.slice(0, 10)
    })
  });
}

function buildPredictionReasons(result: PredictionResult | null, payload: PredictionPayloadSnapshot | null) {
  if (!result || !payload) {
    return [];
  }

  const baseline = result.personalized_baseline;
  const reasons: Array<{ severity: number; message: string }> = [];
  const hasBpOrCardiacHistory = payload.has_hypertension || payload.has_cardiac_history;

  const metricChecks = [
    {
      value: payload.o2_saturation,
      baseline: baseline.o2_saturation,
      warningDelta: 3,
      emergencyDelta: 8,
      lowerIsWorse: true,
      label: 'Oxygen saturation'
    },
    {
      value: payload.hr,
      baseline: baseline.hr,
      warningDelta: 20,
      emergencyDelta: 35,
      lowerIsWorse: false,
      absoluteDifference: true,
      label: 'Heart rate'
    },
    {
      value: payload.sbp,
      baseline: baseline.sbp,
      warningDelta: 10,
      emergencyDelta: hasBpOrCardiacHistory ? 15 : 30,
      lowerIsWorse: false,
      absoluteDifference: !hasBpOrCardiacHistory,
      label: 'Systolic blood pressure'
    },
    {
      value: payload.dbp,
      baseline: baseline.dbp,
      warningDelta: 10,
      emergencyDelta: hasBpOrCardiacHistory ? 15 : 20,
      lowerIsWorse: false,
      absoluteDifference: !hasBpOrCardiacHistory,
      label: 'Diastolic blood pressure'
    },
    {
      value: payload.fbs,
      baseline: baseline.fbs,
      warningDelta: 25,
      emergencyDelta: 80,
      lowerWarningDelta: 15,
      lowerEmergencyDelta: 35,
      label: 'Fasting glucose'
    },
    {
      value: payload.ppbs,
      baseline: baseline.ppbs,
      warningDelta: 40,
      emergencyDelta: 100,
      label: 'Post-meal glucose'
    },
    {
      value: payload.cholesterol,
      baseline: baseline.cholesterol,
      warningDelta: 30,
      emergencyDelta: 90,
      label: 'Cholesterol'
    }
  ];

  metricChecks.forEach((metric) => {
    let severity = 0;

    if (metric.lowerIsWorse) {
      if (metric.value < metric.baseline - metric.emergencyDelta) {
        severity = 2;
      } else if (metric.value < metric.baseline - metric.warningDelta) {
        severity = 1;
      }
    } else if (metric.absoluteDifference) {
      const delta = Math.abs(metric.value - metric.baseline);
      if (delta > metric.emergencyDelta) {
        severity = 2;
      } else if (delta > metric.warningDelta) {
        severity = 1;
      }
    } else if (metric.lowerWarningDelta !== undefined && metric.lowerEmergencyDelta !== undefined) {
      if (metric.value > metric.baseline + metric.emergencyDelta || metric.value < metric.baseline - metric.lowerEmergencyDelta) {
        severity = 2;
      } else if (metric.value > metric.baseline + metric.warningDelta || metric.value < metric.baseline - metric.lowerWarningDelta) {
        severity = 1;
      }
    } else {
      if (metric.value > metric.baseline + metric.emergencyDelta) {
        severity = 2;
      } else if (metric.value > metric.baseline + metric.warningDelta) {
        severity = 1;
      }
    }

    if (severity > 0) {
      const difference = Math.abs(metric.value - metric.baseline);
      reasons.push({
        severity,
        message: `${metric.label} is ${metric.value} versus a baseline of ${metric.baseline} (${difference.toFixed(1)} away).`
      });
    }
  });

  const highestProbability = Object.entries(result.probabilities).sort((first, second) => second[1] - first[1])[0];
  if (highestProbability) {
    reasons.push({
      severity: 0,
      message: `The rule engine finalized ${result.prediction} at ${Math.round((result.alert.confidence || highestProbability[1]) * 100)}% confidence.`
    });
  }

  return reasons
    .sort((first, second) => second.severity - first.severity)
    .slice(0, 3)
    .map((reason) => reason.message);
}

function HealthRiskPrediction({
  patientId: targetPatientId,
  patientName,
  allowAutoSos = true,
  heading = 'Current health risk assessment',
  hideRecommendedAction = false,
  hideAlertChannels = false
}: HealthRiskPredictionProps) {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dataSourceLabel, setDataSourceLabel] = useState('');
  const [resolvedPatientId, setResolvedPatientId] = useState<string | undefined>(undefined);
  const [autoSosMessage, setAutoSosMessage] = useState('');
  const [payloadSnapshot, setPayloadSnapshot] = useState<PredictionPayloadSnapshot | null>(null);
  const [missingDataWarnings, setMissingDataWarnings] = useState<string[]>([]);
  const [latestLogEventKey, setLatestLogEventKey] = useState('');
  const [latestLogDate, setLatestLogDate] = useState('');

  const loadPrediction = async (isRefresh = false) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please log in again to view the ML health risk prediction.');
      setResult(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const profileUrl = targetPatientId ? `${API_BASE_URL}/patients` : `${API_BASE_URL}/patients/me`;
      const logsUrl = targetPatientId
        ? `${API_BASE_URL}/daily_health_logs?patient_id=${encodeURIComponent(targetPatientId)}`
        : `${API_BASE_URL}/daily_health_logs`;

      const [profileData, logsData] = await Promise.all([
        requestJson(profileUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        requestJson(logsUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const profile = targetPatientId && Array.isArray(profileData)
        ? ((profileData as PatientProfile[]).find((entry) => entry._id === targetPatientId)
          || (profileData as Array<PatientProfile & { user_id?: string }>).find((entry) => entry.user_id === targetPatientId)
          || null)
        : (profileData ?? null) as PatientProfile | null;
      const logs = Array.isArray(logsData) ? (logsData as DailyHealthLog[]) : [];
      const latestLog = [...logs]
        .sort((first, second) => {
          const firstTime = getLogTimestamp(first)?.getTime() ?? 0;
          const secondTime = getLogTimestamp(second)?.getTime() ?? 0;
          return secondTime - firstTime;
        })[0];

      if (targetPatientId && !profile) {
        throw new Error('The linked patient profile could not be found for ML prediction.');
      }

      const weight = latestLog?.weight ?? profile?.weight ?? null;
      const bmi = profile?.bmi ?? calculateBmi(weight, profile?.height);
      const payload = {
        patient_id: profile?._id,
        age: profile?.age ?? null,
        gender: profile?.gender ?? null,
        weight,
        bmi,
        o2_saturation: latestLog?.o2_saturation ?? profile?.o2_saturation ?? null,
        hr: latestLog?.heart_rate ?? profile?.heart_rate ?? null,
        sbp: latestLog?.systolic_bp ?? profile?.sbp ?? null,
        dbp: latestLog?.diastolic_bp ?? profile?.dbp ?? null,
        fbs: latestLog?.fasting_blood_glucose ?? profile?.fbs ?? null,
        ppbs: latestLog?.post_prandial_glucose ?? profile?.ppbs ?? null,
        cholesterol: latestLog?.cholesterol ?? profile?.cholesterol ?? null,
        has_hypertension: Boolean(profile?.has_bp),
        has_diabetes: Boolean(profile?.has_diabetes),
        has_cardiac_history: Boolean(profile?.has_cardiac_history)
      };

      const warnings: string[] = [];
      if (!latestLog?.o2_saturation || !latestLog?.heart_rate || !latestLog?.systolic_bp || !latestLog?.diastolic_bp) {
        warnings.push('Some current vitals are missing from today\'s log, so saved profile values were used where available.');
      }
      if (!profile?.bmi && bmi !== null) {
        warnings.push('BMI was calculated from saved height and weight because no stored BMI was available.');
      }

      const missingFields = Object.entries(payload)
        .filter(([key, value]) => key !== 'patient_id' && value === null)
        .map(([key]) => key);

      setMissingDataWarnings([
        ...warnings,
        ...(missingFields.length > 0 ? [`Missing values still blocking prediction: ${missingFields.join(', ')}.`] : [])
      ]);

      if (missingFields.length > 0) {
        throw new Error(`More health data is needed for prediction: ${missingFields.join(', ')}.`);
      }

      const age = Number(payload.age);
      if (age < 55 || age > 110) {
        throw new Error('ML prediction needs a senior patient age between 55 and 110. Update the saved medical details age to continue.');
      }

      const normalizedPayload: PredictionPayloadSnapshot = {
        patient_id: payload.patient_id ?? undefined,
        age,
        gender: String(payload.gender),
        weight: Number(payload.weight),
        bmi: Number(payload.bmi),
        o2_saturation: Number(payload.o2_saturation),
        hr: Number(payload.hr),
        sbp: Number(payload.sbp),
        dbp: Number(payload.dbp),
        fbs: Number(payload.fbs),
        ppbs: Number(payload.ppbs),
        cholesterol: Number(payload.cholesterol),
        has_hypertension: payload.has_hypertension,
        has_diabetes: payload.has_diabetes,
        has_cardiac_history: payload.has_cardiac_history
      };

      const prediction = await predictSafetyStatus(normalizedPayload);

      setResult(prediction as PredictionResult);
      setPayloadSnapshot(normalizedPayload);
      setResolvedPatientId(normalizedPayload.patient_id ?? targetPatientId ?? undefined);
      setLatestLogEventKey(buildLogEventKey(latestLog));
      setLatestLogDate(latestLog?.log_date || '');
      setDataSourceLabel(
        latestLog?.log_date
          ? `Using the latest daily log from ${latestLog.log_date}.`
          : `Using ${targetPatientId ? 'the linked patient' : 'saved'} profile values.`
      );
      setError('');
    } catch (loadError) {
      console.error('Failed to load prediction:', loadError);
      setResult(null);
      setPayloadSnapshot(null);
      setResolvedPatientId(targetPatientId ?? undefined);
      setLatestLogEventKey('');
      setLatestLogDate('');
      setDataSourceLabel('');
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the prediction right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, [targetPatientId]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const historyEntry: RiskHistoryEntry = {
      date: new Date().toISOString(),
      prediction: result.prediction,
      confidence: result.alert.confidence
    };

    const existingHistory = readRiskHistory(resolvedPatientId);
    const lastEntry = existingHistory[existingHistory.length - 1];
    const sameAsLatest =
      lastEntry
      && lastEntry.prediction === historyEntry.prediction
      && new Date(historyEntry.date).getTime() - new Date(lastEntry.date).getTime() < 15 * 60 * 1000;

    const nextHistory = sameAsLatest
      ? [...existingHistory.slice(0, -1), historyEntry]
      : [...existingHistory, historyEntry].slice(-6);

    writeRiskHistory(resolvedPatientId, nextHistory);

    if (resolvedPatientId) {
      saveRiskHistoryEntry(resolvedPatientId, historyEntry, latestLogDate).catch((saveError) => {
        console.error('Failed to save prediction history:', saveError);
      });
    }
  }, [latestLogDate, resolvedPatientId, result]);

  useEffect(() => {
    if (!allowAutoSos) {
      setAutoSosMessage('');
      return;
    }

    const processEmergencyConfidence = async () => {
      if (!result || !resolvedPatientId) {
        return;
      }

      const triggerKey = getPatientStorageKey(resolvedPatientId, 'last-auto-sos');
      const processedLogKey = getPatientStorageKey(resolvedPatientId, 'last-sos-counted-log');
      const todayKey = getCurrentDateKey();

      if (!latestLogDate || latestLogDate !== todayKey || !latestLogEventKey) {
        setAutoSosMessage('SOS monitoring counts only after today\'s daily health log is added.');
        return;
      }

      if (localStorage.getItem(processedLogKey) === latestLogEventKey) {
        setAutoSosMessage('SOS monitoring is already up to date for today\'s latest health log.');
        return;
      }

      if (result.prediction !== 'emergency') {
        localStorage.setItem(processedLogKey, latestLogEventKey);
        setAutoSosMessage('');
        return;
      }

      localStorage.setItem(processedLogKey, latestLogEventKey);

      if ((result.alert.confidence || 0) < AUTO_SOS_CONFIDENCE_THRESHOLD) {
        setAutoSosMessage(`Emergency prediction confidence is ${Math.round((result.alert.confidence || 0) * 100)}%. SOS triggers at 85% or higher.`);
        return;
      }

      const lastTriggerDate = localStorage.getItem(triggerKey);

      if (lastTriggerDate === todayKey) {
        setAutoSosMessage('Automatic SOS was already sent today for a high-confidence emergency prediction.');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setAutoSosMessage('Emergency confidence threshold reached, but SOS could not be sent because you are logged out.');
          return;
        }

        const locationLabel = await getCurrentLocationLabel();
        await requestText(`${API_BASE_URL}/sos`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            location: locationLabel,
            status: 'active'
          })
        });

        localStorage.setItem(triggerKey, todayKey);
        setAutoSosMessage('Automatic SOS sent for an emergency prediction at 85% confidence or higher.');
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      } catch (autoSosError) {
        console.error('Failed to auto-trigger SOS:', autoSosError);
        setAutoSosMessage(autoSosError instanceof Error ? autoSosError.message : 'Automatic SOS could not be sent.');
      }
    };

    processEmergencyConfidence();
  }, [allowAutoSos, latestLogDate, latestLogEventKey, resolvedPatientId, result]);

  const presentation = useMemo(() => {
    const status = result?.prediction ?? 'normal';
    const confidence = result?.alert.confidence ?? 0;

    if (status === 'emergency') {
      if (confidence < AUTO_SOS_CONFIDENCE_THRESHOLD) {
        return {
          badgeClasses: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300',
          panelClasses: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:border-orange-900/60 dark:from-orange-950/40 dark:via-slate-900 dark:to-slate-900',
          accentIconClasses: 'bg-orange-500 text-white shadow-orange-500/25 dark:bg-orange-500 dark:text-white',
          statusIconClasses: 'text-orange-500 dark:text-orange-400',
          probabilityBarClasses: 'bg-orange-500 dark:bg-orange-400',
          Icon: Siren,
          heading: 'Emergency risk detected'
        };
      }

      return {
        badgeClasses: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
        panelClasses: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:border-rose-900/60 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900',
        accentIconClasses: 'bg-rose-500 text-white shadow-rose-500/25 dark:bg-rose-500 dark:text-white',
        statusIconClasses: 'text-rose-500 dark:text-rose-400',
        probabilityBarClasses: 'bg-rose-500 dark:bg-rose-400',
        Icon: Siren,
        heading: 'Emergency risk detected'
      };
    }

    if (status === 'warning') {
      return {
        badgeClasses: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        panelClasses: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:border-amber-900/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900',
        accentIconClasses: 'bg-amber-500 text-white shadow-amber-500/25 dark:bg-amber-500 dark:text-white',
        statusIconClasses: 'text-amber-500 dark:text-amber-400',
        probabilityBarClasses: 'bg-amber-500 dark:bg-amber-400',
        Icon: ShieldAlert,
        heading: 'Warning risk detected'
      };
    }

    return {
      badgeClasses: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
      panelClasses: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900',
      accentIconClasses: 'bg-emerald-500 text-white shadow-emerald-500/25 dark:bg-emerald-500 dark:text-white',
      statusIconClasses: 'text-emerald-500 dark:text-emerald-400',
      probabilityBarClasses: 'bg-emerald-500 dark:bg-emerald-400',
      Icon: CheckCircle2,
      heading: 'Normal risk detected'
    };
  }, [result]);

  const confidencePercent = result ? Math.round((result.alert.confidence || 0) * 100) : 0;
  const probabilityRows = result
    ? Object.entries(result.probabilities).sort((first, second) => second[1] - first[1])
    : [];
  const predictionReasons = buildPredictionReasons(result, payloadSnapshot);
  const summaryGridClasses = hideAlertChannels
    ? 'mt-5 grid gap-4 md:grid-cols-2'
    : 'mt-5 grid gap-4 md:grid-cols-3';

  return (
    <section className={`mt-8 mb-8 rounded-3xl border p-6 shadow-sm ${presentation.panelClasses}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={`rounded-2xl p-3 shadow-lg ${presentation.accentIconClasses}`}>
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {heading}
            </h3>
            {patientName ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Health prediction for {patientName}.
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadPrediction(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh prediction
        </button>
      </div>

      {autoSosMessage ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
          {autoSosMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading the latest patient profile and daily logs.
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Prediction unavailable</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : result ? (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <presentation.Icon className={`h-6 w-6 ${presentation.statusIconClasses}`} />
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{presentation.heading}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{dataSourceLabel}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${presentation.badgeClasses}`}>
                  {toTitleCase(result.prediction)}
                </span>
              </div>

              <div className={summaryGridClasses}>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Confidence</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{confidencePercent}%</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rule-Based Check</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{toTitleCase(result.rule_based_label)}</p>
                </div>
                {!hideAlertChannels ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Alert Channels</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {result.alert.channels.length > 0 ? result.alert.channels.map(formatChannel).join(', ') : 'No escalation'}
                    </p>
                  </div>
                ) : null}
              </div>

              {!hideRecommendedAction ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recommended Action</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{result.alert.recommended_action}</p>
                </div>
              ) : null}

              {predictionReasons.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Why This Prediction?</p>
                  <div className="mt-2 space-y-2">
                    {predictionReasons.map((reason) => (
                      <p key={reason} className="text-sm leading-6 text-slate-700 dark:text-slate-200">{reason}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {missingDataWarnings.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/60 dark:bg-amber-950/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Missing Data Warnings</p>
                  <div className="mt-2 space-y-2">
                    {missingDataWarnings.map((warning) => (
                      <p key={warning} className="text-sm leading-6 text-amber-800 dark:text-amber-200">{warning}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Class Probabilities</p>
              <div className="mt-4 space-y-4">
                {probabilityRows.map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{toTitleCase(label)}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{Math.round(value * 100)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${presentation.probabilityBarClasses}`}
                        style={{ width: `${Math.max(value * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default HealthRiskPrediction;
