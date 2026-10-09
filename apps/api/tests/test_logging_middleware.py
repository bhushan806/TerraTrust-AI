"""Tests for request ID middleware and secret redaction."""

from fastapi.testclient import TestClient
from app.core.logging import redact_sensitive_data


def test_client_provided_request_id(client: TestClient):
    """Verify middleware preserves client-provided X-Request-ID."""
    custom_id = "test-client-req-999"
    response = client.get("/api/v1/health/ready", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id


def test_generated_request_id(client: TestClient):
    """Verify middleware generates a unique X-Request-ID if missing."""
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    req_id = response.headers.get("X-Request-ID")
    assert req_id is not None
    assert len(req_id) >= 16


def test_response_timing_header(client: TestClient):
    """Verify response duration header is included and numeric."""
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    timing = response.headers.get("X-Response-Time-Ms")
    assert timing is not None
    assert float(timing) >= 0.0


def test_redact_sensitive_data():
    """Verify that credentials, tokens, and secrets are masked."""
    sensitive_dict = {
        "username": "loan_officer_1",
        "password": "SuperSecretPassword123!",
        "access_token": "eyJhbGciOi...",
        "api_key": "live_key_987654321",
        "nested": {
            "client_secret": "xyz123",
            "normal_field": "visible_value",
        },
    }

    redacted = redact_sensitive_data(sensitive_dict)
    assert redacted["username"] == "loan_officer_1"
    assert redacted["password"] == "[REDACTED]"
    assert redacted["access_token"] == "[REDACTED]"
    assert redacted["api_key"] == "[REDACTED]"
    assert redacted["nested"]["client_secret"] == "[REDACTED]"
    assert redacted["nested"]["normal_field"] == "visible_value"
