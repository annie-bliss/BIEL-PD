# BIEL-PD — Bio-Inspired Ensemble Learning for Phishing Detection

A research prototype with a React + Vite dashboard and FastAPI inference backend.

## What is implemented

- Random Forest baseline (200 estimators)
- Artificial Immune System detector bank (up to 300 phishing detectors)
- AIS + validation-F1 threshold search (26 candidates from 0.1 to 0.6)
- Test-set metrics: accuracy, precision, recall, F1, confusion counts, FPR and FNR
- Gaussian feature-space mutation robustness experiment (mean 0, std 0.2; clipping to [0,1])
- React dashboard, model analytics, feature-vector inference workbench and adversarial results page
- URL-only preflight endpoint that reports transparent lexical indicators without pretending to produce a trained-model verdict

## Important scope limitation

The research notebook trains on engineered numerical PhiUSIIL features. It does not implement extraction of those features from arbitrary raw URLs or email bodies. Therefore `/api/predict` accepts a complete feature vector matching the trained feature schema. The Scan Center currently uses a real dataset feature record as a demonstration. It is not a raw URL/email scanner.

The notebook's optimizer is a threshold sweep described as HHO-style. This project preserves that method and does not claim a full Harris Hawks Optimization population algorithm.

## Requirements

- Python 3.10+
- Node.js 18+
- Internet connection for the first UCI dataset download

## Setup

### 1. Backend

From the project root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
python backend/train.py
```

Training fetches UCI PhiUSIIL dataset ID 967, performs a stratified 60/20/20 split, fits the models and writes `backend/artifacts/biel_pd.joblib`.

Start the API from the project root:

```powershell
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API

- `GET /api/health` — backend and artifact status
- `GET /api/metrics` — test and robustness metrics
- `GET /api/model-info` — feature schema and training configuration
- `GET /api/sample` — one real raw feature record from the dataset
- `POST /api/predict` — inference on a complete named numerical feature vector
- `POST /api/scan-url` — URL-only preliminary indicators; no model verdict

Example request:

```json
{
  "model": "ais_hho",
  "features": {
    "feature_name_from_model_info": 0.42
  }
}
```

The example is schematic: include every feature returned by `/api/model-info`.

## Reproducibility notes

The implementation follows the notebook's preprocessing, split, model sizes, cosine-distance AIS rule, validation threshold grid and adversarial perturbation protocol. Detector sampling is seeded for reproducibility. Threshold comparisons use one fixed detector bank so the threshold sweep isolates the threshold effect; this is a controlled reproducibility improvement over refitting randomly sampled detectors at each candidate threshold.

## Safety

This is a research demonstration, not a production security gateway. Do not rely on it as the sole control for blocking URLs, handling credentials or making incident-response decisions.
