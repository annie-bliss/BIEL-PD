from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class FeaturePredictionRequest(BaseModel):
    features: Dict[str, float] = Field(..., description="Feature name -> numeric value")
    model: str = Field(default="ais_hho", pattern="^(random_forest|ais|ais_hho)$")

class PredictionResponse(BaseModel):
    prediction: str
    label: int
    model: str
    score: Optional[float] = None
    threshold: Optional[float] = None
    explanation: str


class URLAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="HTTP or HTTPS URL to inspect")
