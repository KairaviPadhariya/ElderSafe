from __future__ import annotations

import json
import pickle
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier

from app.ml_safety.preprocessing import build_preprocessor, prepare_training_frame


CLASS_ORDER = ["normal", "warning", "emergency"]


def _build_model_search_spaces(random_state: int) -> dict[str, tuple[Pipeline, dict]]:
    return {
        "logistic_regression": (
            Pipeline(
                [
                    ("preprocessor", build_preprocessor(scale_numeric=True)),
                    (
                        "classifier",
                        LogisticRegression(
                            max_iter=2000,
                            class_weight="balanced",
                            random_state=random_state,
                        ),
                    ),
                ]
            ),
            {"classifier__C": [0.5, 1.0, 2.0, 4.0]},
        ),
        "decision_tree": (
            Pipeline(
                [
                    ("preprocessor", build_preprocessor(scale_numeric=False)),
                    ("classifier", DecisionTreeClassifier(class_weight="balanced", random_state=random_state)),
                ]
            ),
            {"classifier__max_depth": [4, 6, 8, None], "classifier__min_samples_split": [2, 8, 16]},
        ),
        "random_forest": (
            Pipeline(
                [
                    ("preprocessor", build_preprocessor(scale_numeric=False)),
                    (
                        "classifier",
                        RandomForestClassifier(
                            n_estimators=250,
                            class_weight="balanced_subsample",
                            random_state=random_state,
                        ),
                    ),
                ]
            ),
            {
                "classifier__max_depth": [6, 10, None],
                "classifier__min_samples_split": [2, 6, 12],
                "classifier__min_samples_leaf": [1, 2, 4],
            },
        ),
    }


def train_and_evaluate_models(dataset: pd.DataFrame, output_dir: str | Path, random_state: int = 42) -> dict:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    prepared = prepare_training_frame(dataset)
    x_train, x_test, y_train, y_test = train_test_split(
        prepared.features,
        prepared.target,
        test_size=0.2,
        random_state=random_state,
        stratify=prepared.target,
    )

    results: dict[str, dict] = {}
    best_name = ""
    best_score = -1.0
    best_model = None

    for model_name, (pipeline, parameter_grid) in _build_model_search_spaces(random_state).items():
        search = GridSearchCV(estimator=pipeline, param_grid=parameter_grid, cv=5, n_jobs=1, scoring="f1_macro")
        search.fit(x_train, y_train)
        predictions = search.predict(x_test)
        matrix = confusion_matrix(y_test, predictions, labels=CLASS_ORDER)

        scores = {
            "accuracy": round(accuracy_score(y_test, predictions), 4),
            "precision_macro": round(precision_score(y_test, predictions, average="macro", zero_division=0), 4),
            "recall_macro": round(recall_score(y_test, predictions, average="macro", zero_division=0), 4),
            "f1_macro": round(f1_score(y_test, predictions, average="macro", zero_division=0), 4),
            "best_params": search.best_params_,
            "classification_report": classification_report(y_test, predictions, zero_division=0, output_dict=True),
            "confusion_matrix": matrix.tolist(),
        }
        results[model_name] = scores
        _save_confusion_matrix_plot(matrix, model_name, output_path / f"{model_name}_confusion_matrix.png")

        if scores["f1_macro"] > best_score:
            best_score = scores["f1_macro"]
            best_name = model_name
            best_model = search.best_estimator_

    _save_model_comparison_plot(results, output_path / "model_comparison.png")

    if best_model is None:
        raise RuntimeError("No model was trained.")

    with (output_path / "best_model.pkl").open("wb") as handle:
        pickle.dump(best_model, handle)

    summary = {"best_model_name": best_name, "best_model_f1_macro": best_score, "models": results}
    with (output_path / "metrics_summary.json").open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)

    return summary


def load_model(model_path: str | Path):
    with Path(model_path).open("rb") as handle:
        return pickle.load(handle)


def _save_confusion_matrix_plot(matrix, model_name: str, destination: Path) -> None:
    plt.figure(figsize=(6, 4))
    sns.heatmap(matrix, annot=True, fmt="d", cmap="YlOrRd", xticklabels=CLASS_ORDER, yticklabels=CLASS_ORDER)
    plt.title(f"{model_name.replace('_', ' ').title()} Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(destination)
    plt.close()


def _save_model_comparison_plot(results: dict[str, dict], destination: Path) -> None:
    comparison = pd.DataFrame(
        [
            {
                "model": model_name,
                "accuracy": metrics["accuracy"],
                "precision_macro": metrics["precision_macro"],
                "recall_macro": metrics["recall_macro"],
                "f1_macro": metrics["f1_macro"],
            }
            for model_name, metrics in results.items()
        ]
    )
    comparison = comparison.melt(id_vars="model", var_name="metric", value_name="score")

    plt.figure(figsize=(9, 5))
    sns.barplot(data=comparison, x="metric", y="score", hue="model", palette="Set2")
    plt.ylim(0, 1.05)
    plt.title("Senior Safety Model Comparison")
    plt.tight_layout()
    plt.savefig(destination)
    plt.close()
