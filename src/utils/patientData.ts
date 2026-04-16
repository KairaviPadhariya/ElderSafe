export type FamilyPatientLinkRecord = {
  patient_id?: string;
  patient_name?: string;
};

export type LinkedPatientRecord = {
  _id?: string;
  user_id?: string;
  name?: string;
};

export type DailyVitalsLog = {
  log_date?: string;
  heart_rate?: number;
  o2_saturation?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  fasting_blood_glucose?: number;
  post_prandial_glucose?: number;
};

const WEEK_IN_DAYS = 7;

export function normalizeName(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveLinkedPatient<T extends LinkedPatientRecord>(
  patients: T[],
  familyRecord: FamilyPatientLinkRecord | null
) {
  if (!familyRecord) {
    return null;
  }

  const directMatch =
    patients.find((patient) => patient._id === familyRecord.patient_id) ||
    patients.find((patient) => patient.user_id === familyRecord.patient_id);

  if (directMatch) {
    return directMatch;
  }

  const familyPatientName = normalizeName(familyRecord.patient_name);
  if (!familyPatientName) {
    return null;
  }

  const exactNameMatch = patients.find((patient) => normalizeName(patient.name) === familyPatientName);
  if (exactNameMatch) {
    return exactNameMatch;
  }

  const prefixMatches = patients.filter((patient) => normalizeName(patient.name).startsWith(`${familyPatientName} `));
  if (prefixMatches.length === 1) {
    return prefixMatches[0];
  }

  return null;
}

export function hasSavedPatientLink(familyRecord: FamilyPatientLinkRecord | null) {
  if (!familyRecord) {
    return false;
  }

  return Boolean((familyRecord.patient_id || '').trim() || (familyRecord.patient_name || '').trim());
}

export function getLogDate(logDate?: string) {
  if (!logDate) {
    return null;
  }

  const parsed = new Date(`${logDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getWeekStartDate() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - (WEEK_IN_DAYS - 1));
  return start;
}

export function roundAverage(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

export function getWeeklyAverageVitals(logs: DailyVitalsLog[]) {
  const weekStart = getWeekStartDate();
  const weeklyLogs = logs.filter((log) => {
    const logDate = getLogDate(log.log_date);
    return logDate ? logDate >= weekStart : false;
  });

  const heartRates = weeklyLogs
    .map((log) => log.heart_rate)
    .filter((value): value is number => typeof value === 'number');
  const systolicValues = weeklyLogs
    .map((log) => log.systolic_bp)
    .filter((value): value is number => typeof value === 'number');
  const diastolicValues = weeklyLogs
    .map((log) => log.diastolic_bp)
    .filter((value): value is number => typeof value === 'number');
  const glucoseValues = weeklyLogs
    .flatMap((log) => [log.fasting_blood_glucose, log.post_prandial_glucose])
    .filter((value): value is number => typeof value === 'number');
  const oxygenValues = weeklyLogs
    .map((log) => log.o2_saturation)
    .filter((value): value is number => typeof value === 'number');

  return {
    weeklyLogs,
    averageHeartRate: roundAverage(heartRates),
    averageSystolic: roundAverage(systolicValues),
    averageDiastolic: roundAverage(diastolicValues),
    averageGlucose: roundAverage(glucoseValues),
    averageOxygen: roundAverage(oxygenValues),
  };
}
