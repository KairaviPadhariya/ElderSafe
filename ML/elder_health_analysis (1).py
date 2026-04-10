import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib

def main():
    # 1. Load Data
    data_path = "dataset1.csv"
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    data = pd.read_csv(data_path)
    print("Dataset Loaded Successfully. Head:")
    print(data.head())

    # 2. Preprocess
    data["Gender"] = data["Gender"].map({"Male": 0, "Female": 1})

    def assign_risk(row):
        """
        Risk Levels:
        2 - Emergency: Critical conditions
        1 - Warning: Elevated or borderline critical
        0 - Normal
        """
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

    # 3. Generate and Save Graphs
    graph_dir = "graphs_output"
    os.makedirs(graph_dir, exist_ok=True)
    
    sns.set_theme(style="whitegrid")

    # Graph 1: Risk Level Distribution
    plt.figure(figsize=(8, 6))
    ax = sns.countplot(x="Risk", data=data, palette="Set2")
    plt.title("Distribution of Health Risk Levels")
    plt.xlabel("Risk Level (0: Normal, 1: Warning, 2: Emergency)")
    plt.ylabel("Count")
    for p in ax.patches:
        ax.annotate(f'{int(p.get_height())}', (p.get_x() + p.get_width() / 2., p.get_height()),
                    ha='center', va='center', fontsize=11, color='black', xytext=(0, 5), textcoords='offset points')
    plt.savefig(os.path.join(graph_dir, "risk_distribution.png"))
    plt.close()

    # Graph 2: O2 Saturation by Risk Level
    plt.figure(figsize=(8, 6))
    sns.boxplot(x="Risk", y="O2_Saturation", data=data, palette="Set1")
    plt.title("O2 Saturation vs Risk Level")
    plt.xlabel("Risk Level")
    plt.ylabel("O2 Saturation (%)")
    plt.savefig(os.path.join(graph_dir, "o2_vs_risk.png"))
    plt.close()

    # Graph 3: SBP vs DBP Colored by Risk
    plt.figure(figsize=(8, 6))
    sns.scatterplot(x="SBP", y="DBP", hue="Risk", data=data, palette="coolwarm", alpha=0.7)
    plt.title("Systolic vs Diastolic Blood Pressure by Risk")
    plt.xlabel("Systolic Blood Pressure (SBP)")
    plt.ylabel("Diastolic Blood Pressure (DBP)")
    plt.savefig(os.path.join(graph_dir, "sbp_vs_dbp_risk.png"))
    plt.close()

    # Graph 4: Age Distribution
    plt.figure(figsize=(8, 6))
    sns.histplot(data["Age"], bins=15, kde=True, color="skyblue")
    plt.title("Age Distribution of Patients")
    plt.xlabel("Age")
    plt.ylabel("Frequency")
    plt.savefig(os.path.join(graph_dir, "age_distribution.png"))
    plt.close()

    # Graph 5: Correlation Matrix
    plt.figure(figsize=(10, 8))
    corr = data.corr()
    sns.heatmap(corr, annot=False, cmap="viridis", linewidths=0.5)
    plt.title("Feature Correlation Matrix")
    plt.savefig(os.path.join(graph_dir, "correlation_heatmap.png"))
    plt.close()

    print(f"Graphs successfully generated and saved to '{graph_dir}' directory.")

    # 4. Prepare for ML
    X = data.drop("Risk", axis=1)
    y = data["Risk"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 5. Train Model (Random Forest for better performance & robustness)
    print("Training Random Forest Model...")
    model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train_scaled, y_train)

    # 6. Evaluation
    y_pred = model.predict(X_test_scaled)
    print("\n--- Model Evaluation ---")
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # 7. Save Model and Scaler (Naming them differently from the existing ones)
    joblib.dump(model, "rf_elder_health_model.pkl")
    joblib.dump(scaler, "rf_scaler.pkl")
    print("Model and Scaler saved as 'rf_elder_health_model.pkl' and 'rf_scaler.pkl'.")

if __name__ == "__main__":
    main()
