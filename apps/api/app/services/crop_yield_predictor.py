"""TerraTrust Crop Yield ML Inference Service.

Loads and serves the trained ExtraTreesRegressor model from terratust_crop_yield_model.pkl.
"""

from pathlib import Path
from typing import Dict, List, Optional
import joblib
import pandas as pd
from pydantic import BaseModel, Field, model_validator

# Locate the model file: checks apps/api/models or parent models directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "models" / "terratust_crop_yield_model.pkl"

FEATURES: List[str] = ["Fertilizer", "temp", "N", "P", "K"]

_loaded_model = None


def get_crop_yield_model():
    """Lazy load or return cached scikit-learn model."""
    global _loaded_model
    if _loaded_model is not None:
        return _loaded_model

    if not MODEL_PATH.exists():
        # Fallback check relative to current working directory
        cwd_path = Path("models") / "terratust_crop_yield_model.pkl"
        if cwd_path.exists():
            _loaded_model = joblib.load(cwd_path)
            return _loaded_model
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH} or {cwd_path}")

    _loaded_model = joblib.load(MODEL_PATH)
    return _loaded_model



class YieldInput(BaseModel):
    """Input features matching training dataset."""
    Fertilizer: float = Field(..., ge=0, description="Fertilizer quantity applied (kg/ha or index)", json_schema_extra={"example": 50})
    temp: float = Field(..., description="Temperature in Celsius", json_schema_extra={"example": 25})
    N: float = Field(..., ge=0, description="Nitrogen content in soil", json_schema_extra={"example": 40})
    P: float = Field(..., ge=0, description="Phosphorus content in soil", json_schema_extra={"example": 30})
    K: float = Field(..., ge=0, description="Potassium content in soil", json_schema_extra={"example": 35})

    @model_validator(mode="before")
    @classmethod
    def remap_aliases(cls, data):
        if isinstance(data, dict):
            mapped = dict(data)
            if "fertilizer" in mapped and "Fertilizer" not in mapped:
                mapped["Fertilizer"] = mapped["fertilizer"]
            if "temperature" in mapped and "temp" not in mapped:
                mapped["temp"] = mapped["temperature"]
            if "nitrogen" in mapped and "N" not in mapped:
                mapped["N"] = mapped["nitrogen"]
            if "phosphorus" in mapped and "P" not in mapped:
                mapped["P"] = mapped["phosphorus"]
            if "potassium" in mapped and "K" not in mapped:
                mapped["K"] = mapped["potassium"]
            return mapped
        return data


class YieldOutput(BaseModel):
    """Output prediction conforming to frontend and contract requirements."""
    predicted_yield: float = Field(..., description="Predicted crop yield value")
    unit: str = Field(default="tonnes_per_hectare", description="Yield unit")
    model_used: str = Field(default="ExtraTreesRegressor", description="Model architecture identifier")
    status: str = Field(default="success", description="Inference execution status")


def run_yield_prediction(payload: YieldInput) -> float:
    """Execute prediction using the loaded ExtraTreesRegressor pipeline."""
    model = get_crop_yield_model()
    df = pd.DataFrame([
        {
            "Fertilizer": payload.Fertilizer,
            "temp": payload.temp,
            "N": payload.N,
            "P": payload.P,
            "K": payload.K,
        }
    ])
    prediction = model.predict(df)
    return float(round(prediction[0], 4))
