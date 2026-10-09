"""TerraTrust AI - Backend Application Entrypoint.

Provides the crop yield prediction endpoint along with the complete credit risk platform.
"""

from pathlib import Path
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.main import app

MODEL_PATH = Path(__file__).parent / "models" / "terratust_crop_yield_model.pkl"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

# These match the exact feature names and order used when training the model.
FEATURES = ["Fertilizer", "temp", "N", "P", "K"]


class YieldInput(BaseModel):
    Fertilizer: float = Field(ge=0, description="Fertilizer quantity applied")
    temp: float = Field(description="Temperature in Celsius")
    N: float = Field(ge=0, description="Nitrogen level in soil")
    P: float = Field(ge=0, description="Phosphorus level in soil")
    K: float = Field(ge=0, description="Potassium level in soil")


__all__ = ["app", "model", "FEATURES", "YieldInput"]
