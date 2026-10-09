"""Pydantic schemas for Data Source Governance and Health Monitoring."""

import uuid
from datetime import datetime
from pydantic import BaseModel


class DataSourceResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    terms_uri: str
    license_ref: str
    status: str
    owner: str
    created_at: datetime

    model_config = {"from_attributes": True}
