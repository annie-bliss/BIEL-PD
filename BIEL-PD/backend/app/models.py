from pathlib import Path
import joblib

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "artifacts"

def load_artifacts():
    path = ARTIFACT_DIR / "biel_pd.joblib"
    if not path.exists():
        return None
    return joblib.load(path)
