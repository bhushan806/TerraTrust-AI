"""Schemas module for FIN-03 API."""

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserBranchSummary,
    UserProfileResponse,
    build_user_profile,
)
from app.schemas.borrower import (
    BorrowerCreate,
    BorrowerListResponse,
    BorrowerResponse,
    BorrowerUpdate,
)
from app.schemas.common import ErrorBody, ErrorEnvelope, HealthResponse
from app.schemas.data_import import DataImportCreate, DataImportResponse
from app.schemas.farm import (
    CropCycleCreate,
    CropCycleResponse,
    FarmCreate,
    FarmResponse,
    PlotCreate,
    PlotResponse,
)
from app.schemas.institution import (
    BranchResponse,
    InstitutionResponse,
    UpdateUserRolesRequest,
    UserInviteRequest,
    UserSummaryResponse,
)
from app.schemas.loan import (
    LoanApplicationCreate,
    LoanApplicationResponse,
    RepaymentEventCreate,
    RepaymentEventResponse,
    RepaymentScheduleCreate,
    RepaymentScheduleItemResponse,
)
from app.schemas.assessment import (
    AssessmentCreateRequest,
    AssessmentHistoryItemResponse,
    AssessmentResponse,
    IncomeEstimateRequest,
    IncomeEstimateResponse,
    PredictionHorizon,
    RiskExplanationResponse,
    ScenarioRunCreateRequest,
    ScenarioRunResponse,
    YieldInferenceRequest,
    YieldInferenceResponse,
)
from app.schemas.observation import (
    ClimateObservationResponse,
    MarketPriceResponse,
    ObservationsResponse,
    SatelliteObservationResponse,
    SoilMoistureResponse,
)
from app.schemas.alert import AlertResponse, AlertUpdate
from app.schemas.data_source import DataSourceResponse
from app.schemas.report import (
    ReportCreateRequest,
    ReportResponse,
    ReportSummary,
)

__all__ = [
    "ErrorBody",
    "ErrorEnvelope",
    "HealthResponse",
    "LoginRequest",
    "TokenResponse",
    "UserBranchSummary",
    "UserProfileResponse",
    "build_user_profile",
    "InstitutionResponse",
    "BranchResponse",
    "UserSummaryResponse",
    "UserInviteRequest",
    "UpdateUserRolesRequest",
    "BorrowerCreate",
    "BorrowerUpdate",
    "BorrowerResponse",
    "BorrowerListResponse",
    "PlotCreate",
    "PlotResponse",
    "FarmCreate",
    "FarmResponse",
    "CropCycleCreate",
    "CropCycleResponse",
    "LoanApplicationCreate",
    "LoanApplicationResponse",
    "RepaymentScheduleCreate",
    "RepaymentScheduleItemResponse",
    "RepaymentEventCreate",
    "RepaymentEventResponse",
    "ClimateObservationResponse",
    "SatelliteObservationResponse",
    "SoilMoistureResponse",
    "ObservationsResponse",
    "MarketPriceResponse",
    "DataImportCreate",
    "DataImportResponse",
    "PredictionHorizon",
    "YieldInferenceRequest",
    "YieldInferenceResponse",
    "IncomeEstimateRequest",
    "IncomeEstimateResponse",
    "AssessmentCreateRequest",
    "AssessmentResponse",
    "ScenarioRunCreateRequest",
    "ScenarioRunResponse",
    "RiskExplanationResponse",
    "AssessmentHistoryItemResponse",
    "ReportCreateRequest",
    "ReportResponse",
    "ReportSummary",
    "AlertResponse",
    "AlertUpdate",
    "DataSourceResponse",
]
