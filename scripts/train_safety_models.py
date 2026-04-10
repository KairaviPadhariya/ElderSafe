from __future__ import annotations

import argparse
from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.ml_safety.data_sources import load_local_training_dataset
from app.ml_safety.synthetic_data import generate_senior_health_dataset, save_dataset
from app.ml_safety.trainer import train_and_evaluate_models


def main() -> None:
    parser = argparse.ArgumentParser(description="Train ML models for the Senior Citizen Safety System.")
    parser.add_argument("--source", choices=["local_csv", "synthetic"], default="local_csv", help="Training data source.")
    parser.add_argument("--csv-path", type=str, default="senior_citizen_safety_dataset.csv", help="Path to uploaded CSV.")
    parser.add_argument("--samples", type=int, default=2500, help="Number of synthetic rows to generate.")
    parser.add_argument("--missing-rate", type=float, default=0.03, help="Share of missing values to inject.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    args = parser.parse_args()

    artifact_root = Path("artifacts") / "ml_safety"
    if args.source == "local_csv":
        dataset = load_local_training_dataset(args.csv_path)
        dataset_path = save_dataset(dataset, artifact_root / "dataset" / "training_dataset_from_local_csv.csv")
    else:
        dataset = generate_senior_health_dataset(
            n_samples=args.samples,
            missing_rate=args.missing_rate,
            random_state=args.seed,
        )
        dataset_path = save_dataset(dataset, artifact_root / "dataset" / "synthetic_senior_health.csv")

    summary = train_and_evaluate_models(dataset, artifact_root / "models", random_state=args.seed)

    print(f"Dataset saved to: {dataset_path}")
    print(f"Best model: {summary['best_model_name']}")
    print(f"Best F1 macro: {summary['best_model_f1_macro']}")


if __name__ == "__main__":
    main()
