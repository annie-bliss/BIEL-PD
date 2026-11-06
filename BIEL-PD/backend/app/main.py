from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd
from .models import load_artifacts
from .schemas import FeaturePredictionRequest, URLAnalysisRequest
from .url_analysis import analyze_url

app = FastAPI(title="BIEL-PD API", version="1.0.0",
              description="Bio-inspired phishing detection research API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
ARTIFACTS = load_artifacts()

@app.get("/api/health")
def health():
    return {"status": "ok", "trained": ARTIFACTS is not None,
            "message": "Models loaded" if ARTIFACTS else "Run backend/train.py first"}

@app.get("/api/metrics")
def metrics():
    if ARTIFACTS is None:
        raise HTTPException(503, "Models are not trained. Run backend/train.py.")
    return ARTIFACTS["metrics"]

@app.get("/api/model-info")
def model_info():
    if ARTIFACTS is None:
        raise HTTPException(503, "Models are not trained. Run backend/train.py.")
    return {
        "dataset": "UCI PhiUSIIL Phishing URL Dataset (ID 967)",
        "feature_count": len(ARTIFACTS["feature_names"]),
        "feature_names": ARTIFACTS["feature_names"],
        "split": {"train": 0.6, "validation": 0.2, "test": 0.2},
        "ais_detectors": int(len(ARTIFACTS["ais_hho"]["detectors"])),
        "hho_style_threshold": ARTIFACTS["ais_hho"]["threshold"],
        "optimizer": "Validation F1 threshold sweep (26 candidates, 0.1–0.6)"
    }

@app.post("/api/predict")
def predict(request: FeaturePredictionRequest):
    if ARTIFACTS is None:
        raise HTTPException(503, "Models are not trained. Run backend/train.py.")
    names = ARTIFACTS["feature_names"]
    missing = [name for name in names if name not in request.features]
    extra = [name for name in request.features if name not in names]
    if missing:
        raise HTTPException(422, {
            "message": "Feature vector does not match the trained schema.",
            "missing_features": missing[:20], "missing_count": len(missing),
            "extra_features": extra[:20]
        })
    row = pd.DataFrame([[request.features[n] for n in names]], columns=names)
    scaled = ARTIFACTS["scaler"].transform(row)
    if request.model == "random_forest":
        model = ARTIFACTS["random_forest"]
        label = int(model.predict(scaled)[0])
        score = float(model.predict_proba(scaled)[0][1])
        threshold = None
        explanation = "Random Forest phishing-class probability."
    else:
        key = "ais" if request.model == "ais" else "ais_hho"
        model = ARTIFACTS[key]
        score = float(model["detector"].score_samples(scaled)[0])
        threshold = float(model["threshold"])
        label = int(score < threshold)
        explanation = "Minimum cosine distance to learned phishing detectors; lower distance indicates a closer match."
    return {
        "prediction": "PHISHING" if label == 1 else "LEGITIMATE",
        "label": label, "model": request.model, "score": score,
        "threshold": threshold, "explanation": explanation
    }

@app.get("/api/sample")
def sample():
    if ARTIFACTS is None:
        raise HTTPException(503, "Models are not trained. Run backend/train.py.")
    return ARTIFACTS["sample_record"]


@app.post("/api/scan-url")
def scan_url(request: URLAnalysisRequest):
    """Run safe URL-only preflight checks; does not invoke the trained models."""
    try:
        return analyze_url(request.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
