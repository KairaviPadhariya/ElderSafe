import pandas as pd
import numpy as np

data = pd.read_csv("dataset1.csv")
print(data.head())
data["Gender"] = data["Gender"].map({"Male": 0, "Female": 1})

def assign_risk(row):
    if (row["O2_Saturation"] < 90 or
        row["SBP"] > 180 or
        row["FBS"] > 250 or
        row["PPBS"] > 300):
        return 2  # Emergency
    
    elif (90 <= row["O2_Saturation"] <= 94 or
          140 <= row["SBP"] <= 180 or
          140 <= row["FBS"] <= 250):
        return 1  # Warning
    
    else:
        return 0  # Normal

data["Risk"] = data.apply(assign_risk, axis=1)

# print(data.columns)
# print(data.head())

X = data.drop("Risk", axis=1)
y = data["Risk"]

from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(
    max_depth=5,
    random_state=42
)

model.fit(X_train, y_train)

# model evaluation
from sklearn.metrics import classification_report, confusion_matrix

y_pred = model.predict(X_test)

print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))

new_patient = [[
    75,   # Age
    1,    # Gender (Female)
    160,  # Height (cm)
    70,   # Weight (kg)
    27.3, # BMI
    89,   # O2 Saturation
    120,  # Heart Rate
    170,  # SBP
    105,  # DBP
    220,  # FBS
    310,  # PPBS
    260   # Cholesterol
]]

new_patient_scaled = scaler.transform(new_patient)
prediction = model.predict(new_patient_scaled)

print("Predicted Risk Level:", prediction[0])

if new_patient[0][5] < 90:
    print("🚨 EMERGENCY: Oxygen Level Critical")
else:
    print("ML Prediction:", prediction[0])

import joblib

joblib.dump(model, "elder_health_model.pkl")
joblib.dump(scaler, "scaler.pkl")