const DEFAULT_ML_API_URL = "http://127.0.0.1:8010";
const ML_API_URL = (import.meta.env.VITE_ML_API_URL || DEFAULT_ML_API_URL).replace(/\/$/, "");

export type SafetyPredictionPayload = {
  patient_id?: string;
  doctor_contact?: string;
  family_contact?: string;
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
  has_hypertension?: boolean;
  has_diabetes?: boolean;
  has_copd?: boolean;
  has_cardiac_history?: boolean;
};

export const trainSafetyModels = async (
  source: "local_csv" | "mongo" | "synthetic" = "local_csv",
  options?: { n_samples?: number; csv_path?: string; collection_name?: string }
) => {
  const response = await fetch(`${ML_API_URL}/ml-safety/train`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source,
      n_samples: options?.n_samples ?? 2500,
      csv_path: options?.csv_path ?? "senior_citizen_safety_dataset.csv",
      collection_name: options?.collection_name ?? "senior_safety_dataset"
    })
  });

  return response.json();
};

export const importSafetyDatasetToMongo = async (
  csv_path = "senior_citizen_safety_dataset.csv",
  collection_name = "senior_safety_dataset"
) => {
  const response = await fetch(`${ML_API_URL}/ml-safety/dataset/import-local`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ csv_path, collection_name, replace: true })
  });

  return response.json();
};

export const getSafetyDatasetRecords = async (collection_name = "senior_safety_dataset", limit = 100) => {
  const response = await fetch(
    `${ML_API_URL}/ml-safety/dataset/records?collection_name=${encodeURIComponent(collection_name)}&limit=${limit}`
  );

  return response.json();
};

export const predictSafetyStatus = async (payload: SafetyPredictionPayload) => {
  const response = await fetch(`${ML_API_URL}/ml-safety/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return response.json();
};

export const monitorSafetyTrend = async (records: Array<Record<string, string | number>>) => {
  const response = await fetch(`${ML_API_URL}/ml-safety/monitor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ records })
  });

  return response.json();
};
