# Senior Citizen Safety System ML Prototype

This prototype adds a fully separate ML service without modifying any existing frontend or backend files.
It now supports training from the uploaded local CSV and loading dataset records from MongoDB Atlas for website use.

## 1. Dataset source

Primary training file:

- `senior_citizen_safety_dataset.csv`

The uploaded CSV is normalized into the model format with these mappings:

- `Age` -> `age`
- `Gender` -> `gender`
- `Weight` -> `weight`
- `BMI` -> `bmi`
- `O2 saturation` -> `o2_saturation`
- `HR` -> `hr`
- `SBP` -> `sbp`
- `DBP` -> `dbp`
- `FBS` -> `fbs`
- `PPBS` -> `ppbs`
- `Cholesterol` -> `cholesterol`
- `Health_Status` -> `situation_label`

Synthetic generation still exists as a fallback, but the default training path now uses your uploaded CSV.

## 2. Dataset handling

The local CSV and MongoDB collection both support these health fields:

- age
- gender
- weight
- BMI
- O2 saturation
- HR
- SBP / DBP
- FBS / PPBS
- cholesterol
- disease context flags for hypertension, diabetes, COPD, and cardiac history

If disease flags are not present in the uploaded CSV, the training pipeline fills them with `False`. For real patient accounts, those fields should come from profile data in MongoDB so prediction thresholds become personalized. For example, a patient with hypertension gets a higher personal BP baseline, and the system treats a deviation of more than `+/- 10 mmHg` as a warning.

Run:

```powershell
venv\Scripts\python scripts\train_safety_models.py --source local_csv --csv-path senior_citizen_safety_dataset.csv
```

To import the same dataset into MongoDB Atlas:

```powershell
venv\Scripts\python scripts\import_safety_dataset_to_mongo.py --csv-path senior_citizen_safety_dataset.csv --collection-name senior_safety_dataset
```

## 3. Preprocessing and feature engineering

The pipeline performs:

- duplicate removal
- outlier clipping to realistic medical ranges
- missing value handling with imputation
- one-hot encoding for gender and BMI category
- scaling for logistic regression
- engineered features:
  - pulse pressure
  - mean arterial pressure
  - glucose delta
  - personalized deltas from disease-aware baselines

Core files:

- `app/ml_safety/preprocessing.py`
- `app/ml_safety/thresholds.py`

## 4. Models

Three classifiers are trained and compared:

- Logistic Regression
- Decision Tree
- Random Forest

Training includes:

- train/test split
- 5-fold cross-validation
- hyperparameter tuning with `GridSearchCV`
- evaluation using accuracy, precision, recall, macro F1, classification report, and confusion matrix

Artifacts are saved in:

- `artifacts/ml_safety/dataset/`
- `artifacts/ml_safety/models/`

## 5. FastAPI service

Standalone service entrypoint:

```powershell
venv\Scripts\python -m uvicorn app.safety_ml_app:app --host 127.0.0.1 --port 8010 --reload
```

Endpoints:

- `GET /ml-safety/health`
- `POST /ml-safety/dataset/import-local`
- `GET /ml-safety/dataset/records`
- `POST /ml-safety/train`
- `POST /ml-safety/predict`
- `POST /ml-safety/monitor`

Training from local CSV:

```json
{
  "source": "local_csv",
  "csv_path": "senior_citizen_safety_dataset.csv"
}
```

Training from MongoDB Atlas:

```json
{
  "source": "mongo",
  "collection_name": "senior_safety_dataset"
}
```

Example prediction request:

```json
{
  "patient_id": "P-1001",
  "doctor_contact": "doctor@example.com",
  "family_contact": "family@example.com",
  "age": 72,
  "gender": "female",
  "weight": 64,
  "bmi": 25.3,
  "o2_saturation": 90,
  "hr": 112,
  "sbp": 154,
  "dbp": 94,
  "fbs": 168,
  "ppbs": 242,
  "cholesterol": 228,
  "has_hypertension": true,
  "has_diabetes": true,
  "has_copd": false,
  "has_cardiac_history": false
}
```

The response includes:

- ML prediction
- rule-based risk label
- class probabilities
- personalized baseline
- alert routing payload

## 6. Frontend integration

No existing frontend files were changed. A new helper client was added:

- `src/services/seniorSafetyApi.ts`

Typical usage inside a React page or dashboard:

```ts
import {
  getSafetyDatasetRecords,
  importSafetyDatasetToMongo,
  monitorSafetyTrend,
  predictSafetyStatus,
  trainSafetyModels
} from "../services/seniorSafetyApi";

await importSafetyDatasetToMongo();
const dataset = await getSafetyDatasetRecords("senior_safety_dataset", 50);
await trainSafetyModels("mongo", { collection_name: "senior_safety_dataset" });

const result = await predictSafetyStatus({
  age: 72,
  gender: "female",
  weight: 64,
  bmi: 25.3,
  o2_saturation: 90,
  hr: 112,
  sbp: 154,
  dbp: 94,
  fbs: 168,
  ppbs: 242,
  cholesterol: 228,
  has_hypertension: true,
  has_diabetes: true
});
```

Suggested UI flow:

- import uploaded CSV into Atlas once
- load dataset records from `getSafetyDatasetRecords` for table/chart views
- collect daily vitals from patient device or manual entry
- call `predictSafetyStatus`
- if response alert status is `warning` or `emergency`, show banner on doctor dashboard and notify family dashboard
- use `monitorSafetyTrend` for a rolling 3-day summary

## 7. Alerting design

The current prototype returns a channel plan instead of sending real SMS or email directly.

Recommended production wiring:

- store doctor and family contacts in MongoDB Atlas
- trigger Twilio for SMS
- trigger SendGrid or SMTP for email
- save generated alerts into the existing notifications collection
- publish websocket or polling updates to React dashboards

## 8. Optional integration with the existing FastAPI app

To keep the current backend untouched, the ML module runs as a separate service today.

When you are ready to integrate later, the existing FastAPI app can include:

```python
from app.ml_safety.router import router as ml_safety_router
app.include_router(ml_safety_router)
```

That step was intentionally not applied because your constraint forbids modifying current backend files.

## 9. Suggestions for improvement

- replace synthetic data with real wearable or hospital data
- add time-series anomaly detection for continuous streaming
- persist model metadata and versioning
- add SHAP explainability for doctor-facing explanations
- connect alerts to Twilio, email, and push notifications
- schedule background retraining with fresh daily logs
