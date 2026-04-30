const DEFAULT_ML_API_URL = "http://127.0.0.1:8010";
const ML_API_URL = (import.meta.env.VITE_ML_API_URL || DEFAULT_ML_API_URL).replace(/\/$/, "");
const ML_API_CANDIDATES = Array.from(
  new Set([
    ML_API_URL,
    "http://127.0.0.1:8010"
  ])
);

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
  has_cardiac_history?: boolean;
};

async function requestMlJson(path: string, options: RequestInit = {}) {
  let lastConnectionError: Error | null = null;

  for (const baseUrl of ML_API_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(formatApiError(data, "ML request failed"));
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        lastConnectionError = error;
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `Could not connect to the ML prediction service. Tried ${ML_API_CANDIDATES.join(", ")}. Start the ML backend or set VITE_ML_API_URL to the correct address.${lastConnectionError ? "" : ""}`
  );
}

function formatApiError(data: unknown, fallback: string): string {
  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => formatApiError(item, fallback)).join("; ");
  }

  if (typeof data === "object") {
    const errorData = data as {
      detail?: unknown;
      message?: unknown;
      msg?: unknown;
      loc?: unknown;
    };

    if (errorData.detail) {
      return formatApiError(errorData.detail, fallback);
    }

    if (errorData.message) {
      return formatApiError(errorData.message, fallback);
    }

    if (errorData.msg) {
      const location = Array.isArray(errorData.loc)
        ? errorData.loc.filter((part) => part !== "body").join(".")
        : "";
      const message = formatApiError(errorData.msg, fallback);
      return location ? `${location}: ${message}` : message;
    }

    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }

  return String(data);
}

export const trainSafetyModels = async (
  source: "local_csv" | "mongo" | "synthetic" = "local_csv",
  options?: { n_samples?: number; csv_path?: string; collection_name?: string }
) => {
  return requestMlJson("/ml-safety/train", {
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
};

export const importSafetyDatasetToMongo = async (
  csv_path = "senior_citizen_safety_dataset.csv",
  collection_name = "senior_safety_dataset"
) => {
  return requestMlJson("/ml-safety/dataset/import-local", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ csv_path, collection_name, replace: true })
  });
};

export const getSafetyDatasetRecords = async (collection_name = "senior_safety_dataset", limit = 100) => {
  return requestMlJson(
    `/ml-safety/dataset/records?collection_name=${encodeURIComponent(collection_name)}&limit=${limit}`
  );
};

export const predictSafetyStatus = async (payload: SafetyPredictionPayload) => {
  return requestMlJson("/ml-safety/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
};

export const monitorSafetyTrend = async (records: Array<Record<string, string | number>>) => {
  return requestMlJson("/ml-safety/monitor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ records })
  });
};
