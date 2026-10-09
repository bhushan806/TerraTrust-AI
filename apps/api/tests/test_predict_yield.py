"""Tests for TerraTrust Crop Yield Prediction Endpoint and ML Model."""

import pytest
from starlette.testclient import TestClient
from app.main import app
from app.services.crop_yield_predictor import YieldInput, run_yield_prediction, get_crop_yield_model


def test_crop_yield_model_loaded():
    """Verify that the ExtraTreesRegressor model pipeline loads properly."""
    model = get_crop_yield_model()
    assert model is not None
    assert hasattr(model, "predict")
    assert hasattr(model, "named_steps")
    assert "imputer" in model.named_steps
    assert "model" in model.named_steps


def test_crop_yield_direct_prediction():
    """Verify direct service prediction using example agro-climatic values."""
    payload = YieldInput(Fertilizer=50.0, temp=25.0, N=40.0, P=30.0, K=35.0)
    predicted_yield = run_yield_prediction(payload)
    assert isinstance(predicted_yield, float)
    assert predicted_yield > 0
    assert round(predicted_yield, 2) == 10.01


def test_predict_yield_endpoint_success():
    """Verify POST /predict-yield returns 200 with predicted_yield."""
    client = TestClient(app)
    response = client.post(
        "/predict-yield",
        json={
            "Fertilizer": 50,
            "temp": 25,
            "N": 40,
            "P": 30,
            "K": 35,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "predicted_yield" in data
    assert round(data["predicted_yield"], 2) == 10.01


def test_predict_yield_endpoint_validation_error():
    """Verify POST /predict-yield validates input constraints (e.g. negative values)."""
    client = TestClient(app)
    response = client.post(
        "/predict-yield",
        json={
            "Fertilizer": -10,  # invalid: ge=0
            "temp": 25,
            "N": 40,
            "P": 30,
            "K": 35,
        },
    )
    assert response.status_code in [400, 422]


def test_cors_headers_on_predict_yield():
    """Verify CORS preflight and headers allow frontend origins."""
    client = TestClient(app)
    response = client.options(
        "/predict-yield",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
