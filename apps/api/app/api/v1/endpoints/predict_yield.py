"""Crop Yield Prediction Endpoint.

Serves ML model inference directly for frontend forms and credit risk assessments.
"""

from fastapi import APIRouter, HTTPException, status
from app.services.crop_yield_predictor import YieldInput, YieldOutput, run_yield_prediction

router = APIRouter(tags=["AI/ML Yield Model"])


@router.post(
    "/predict-yield",
    response_model=YieldOutput,
    status_code=status.HTTP_200_OK,
    summary="Predict Crop Yield from Agro-Climatic Features",
    description="Takes soil nutrients (N, P, K), temperature, and fertilizer values to predict expected crop yield using the trained ExtraTreesRegressor model.",
)
def predict_crop_yield_endpoint(payload: YieldInput):
    """Predict crop yield using the deployed TerraTrust ML model."""
    try:
        prediction = run_yield_prediction(payload)
        return YieldOutput(predicted_yield=prediction)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(exc)}",
        )
