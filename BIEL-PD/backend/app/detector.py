import numpy as np
from sklearn.metrics.pairwise import cosine_distances


class AISDetector:
    def __init__(self, n_detectors=300, threshold=0.35, random_state=42):
        self.n_detectors = n_detectors
        self.threshold = threshold
        self.random_state = random_state
        self.detectors = None

    def fit(self, X_phish):
        values = np.asarray(X_phish, dtype=float)
        n_det = min(self.n_detectors, len(values))

        rng = np.random.default_rng(self.random_state)
        indices = rng.choice(len(values), size=n_det, replace=False)
        self.detectors = values[indices]

    def score_samples(self, X):
        return cosine_distances(
            np.asarray(X, dtype=float), self.detectors
        ).min(axis=1)

    def predict(self, X):
        return (self.score_samples(X) < self.threshold).astype(int)