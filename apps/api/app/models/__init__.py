"""Domain ORM models for FIN-03 Agricultural Decision-Support System."""

from app.models.assessment import (
    Alert,
    CreditAssessment,
    IncomeEstimate,
    RiskExplanation,
    ScenarioRun,
    YieldPrediction,
)
from app.models.audit import AuditEvent
from app.models.base import Base, CreationTimestampMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.farm import Farm, Plot
from app.models.governance import DataSource, ModelVersion, SourceRecord
from app.models.institution import Branch, Institution, UserBranch
from app.models.job import Job
from app.models.loan import Loan, LoanApplication, RepaymentEvent, RepaymentSchedule
from app.models.market import MarketPrice
from app.models.observation import (
    ClimateObservation,
    Forecast,
    SatelliteObservation,
    SoilMoisture,
)
from app.models.user import Permission, Role, User, role_permissions, user_roles

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "Institution",
    "Branch",
    "UserBranch",
    "User",
    "Role",
    "Permission",
    "user_roles",
    "role_permissions",
    "Borrower",
    "Farm",
    "Plot",
    "CropCycle",
    "ClimateObservation",
    "Forecast",
    "SatelliteObservation",
    "SoilMoisture",
    "MarketPrice",
    "LoanApplication",
    "Loan",
    "RepaymentSchedule",
    "RepaymentEvent",
    "DataSource",
    "SourceRecord",
    "ModelVersion",
    "CreditAssessment",
    "YieldPrediction",
    "IncomeEstimate",
    "ScenarioRun",
    "RiskExplanation",
    "Alert",
    "AuditEvent",
    "Job",
]
