"""Train BIEL-PD models using the same core workflow as the research notebook.

Dataset: UCI PhiUSIIL Phishing URL Dataset, repository ID 967.
Labels: legitimate=0, phishing=1.
Split: stratified 60/20/20; Random Forest; AIS cosine-distance detector;
validation F1 threshold sweep (HHO-style, not full population-based HHO).
"""
from pathlib import Path
import sys
import joblib
import numpy as np
import pandas as pd
from ucimlrepo import fetch_ucirepo
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix)


ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent))

from backend.app.detector import AISDetector

ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)
RANDOM_STATE = 42


def metrics_for(y_true, y_pred):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0,1]).ravel()
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
        "fpr": float(fp / (fp + tn)) if fp + tn else 0.0,
        "fnr": float(fn / (fn + tp)) if fn + tp else 0.0,
    }

def main():
    print("Fetching UCI PhiUSIIL dataset (ID 967)...")
    dataset = fetch_ucirepo(id=967)
    X = dataset.data.features.copy()
    y = dataset.data.targets.squeeze().copy()

    if y.dtype == "object":
        y = y.map({"legitimate": 0, "phishing": 1})
    valid = y.notna()
    X, y = X.loc[valid].copy(), y.loc[valid].astype(int).copy()

    drop_cols = [c for c in ["label", "class", "target", "result", "status",
                              "url", "URL", "phishing_url"] if c in X.columns]
    X = X.drop(columns=drop_cols, errors="ignore")
    X = X.apply(pd.to_numeric, errors="coerce").fillna(0)

    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.4, random_state=RANDOM_STATE, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=RANDOM_STATE, stratify=y_temp)

    scaler = MinMaxScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)

    print("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1)
    rf.fit(X_train_s, y_train)
    rf_metrics = metrics_for(y_test, rf.predict(X_test_s))

    phishing_train = X_train_s[np.asarray(y_train) == 1]
    print("Fitting AIS...")
    ais = AISDetector(300, 0.35, RANDOM_STATE)
    ais.fit(phishing_train)
    ais_metrics = metrics_for(y_test, ais.predict(X_test_s))

    print("Selecting AIS threshold on validation F1...")
    candidates = np.linspace(0.1, 0.6, 26)
    best_threshold, best_f1 = None, -1
    # A fixed detector bank makes threshold comparisons controlled/reproducible.
    for threshold in candidates:
        candidate = AISDetector(300, float(threshold), RANDOM_STATE)
        candidate.fit(phishing_train)
        score = f1_score(y_val, candidate.predict(X_val_s), zero_division=0)
        if score > best_f1:
            best_f1, best_threshold = float(score), float(threshold)

    ais_hho = AISDetector(300, best_threshold, RANDOM_STATE)
    ais_hho.fit(phishing_train)
    ais_hho_metrics = metrics_for(y_test, ais_hho.predict(X_test_s))

    # Reproduce the notebook's Gaussian feature perturbation on phishing test rows.
    phishing_test = X_test_s[np.asarray(y_test) == 1]
    rng = np.random.default_rng(123)
    mutated = np.clip(phishing_test + rng.normal(0.0, 0.2, phishing_test.shape), 0, 1)
    mutated_pred = ais_hho.predict(mutated)
    robust_metrics = metrics_for(np.ones(len(mutated), dtype=int), mutated_pred)

    metrics = {
        "models": [
            {"name": "Baseline ML", "key": "random_forest", **rf_metrics},
            {"name": "AIS Only", "key": "ais", **ais_metrics},
            {"name": "AIS + HHO-style", "key": "ais_hho", **ais_hho_metrics},
        ],
        "robustness": {"clean_phishing_samples": int(len(phishing_test)),
                       "accuracy": robust_metrics["accuracy"], "f1": robust_metrics["f1"],
                       "confusion": {k: robust_metrics[k] for k in ["tn","fp","fn","tp"]}},
        "training": {"train_samples": int(len(X_train)), "validation_samples": int(len(X_val)),
                     "test_samples": int(len(X_test)), "feature_count": int(X.shape[1]),
                     "threshold_candidates": [round(float(x), 3) for x in candidates],
                     "best_threshold": float(best_threshold), "validation_f1": float(best_f1)}
    }
    sample_index = 0
    sample_record = {name: float(value) for name, value in
                     zip(X.columns, X.iloc[sample_index].values)}
    bundle = {
        "random_forest": rf, "ais": {"detector": ais, "detectors": ais.detectors,
                                     "threshold": ais.threshold},
        "ais_hho": {"detector": ais_hho, "detectors": ais_hho.detectors,
                    "threshold": ais_hho.threshold},
        "scaler": scaler, "feature_names": list(X.columns),
        "metrics": metrics, "sample_record": sample_record
    }
    joblib.dump(bundle, ARTIFACTS / "biel_pd.joblib", compress=3)
    print("\nTraining complete. Saved:", ARTIFACTS / "biel_pd.joblib")
    print("Best AIS threshold:", best_threshold, "| validation F1:", round(best_f1, 4))
    print(pd.DataFrame(metrics["models"])[["name","accuracy","precision","recall","f1"]].to_string(index=False))

if __name__ == "__main__":
    main()
