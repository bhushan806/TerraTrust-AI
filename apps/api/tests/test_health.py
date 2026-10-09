"""Tests for health check and readiness endpoints (API-034)."""

from unittest.mock import patch
from fastapi.testclient import TestClient


def test_readiness_check(client: TestClient):
    """Verify GET /api/v1/health/ready returns 200 with environment and version."""
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data
    assert data["database"] == "connected"
    assert "X-Request-ID" in response.headers
    assert "X-Response-Time-Ms" in response.headers


def test_readiness_check_db_failure(client: TestClient):
    """Verify GET /api/v1/health/ready returns 503 when database connectivity fails."""
    with patch("app.api.v1.endpoints.health.check_db_connectivity", return_value=False):
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"


def test_liveness_check(client: TestClient):
    """Verify GET /api/v1/health/live returns 200."""
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_root_health(client: TestClient):
    """Verify root GET /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
