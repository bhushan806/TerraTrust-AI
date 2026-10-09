"""Tests for error envelope compliance with error.schema.json contract."""

from fastapi import APIRouter
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator
from app.core.errors import NotFoundException, UnauthorizedException, ValidationException
from app.main import create_app

# Simulation router to trigger specific error conditions
error_simulation_router = APIRouter(prefix="/api/v1/test-errors")


@error_simulation_router.get("/not-found")
def trigger_not_found():
    raise NotFoundException("Specific borrower record was not found")


@error_simulation_router.get("/unauthorized")
def trigger_unauthorized():
    raise UnauthorizedException("Invalid or expired session token")


@error_simulation_router.get("/validation-fail")
def trigger_validation():
    raise ValidationException(
        "Invalid acreage parameter",
        details=[{"field": "area_value", "error": "Must be greater than 0"}],
    )


@error_simulation_router.get("/unhandled")
def trigger_unhandled():
    raise RuntimeError("Unexpected internal malfunction")


def test_404_error_envelope(client: TestClient, error_schema_validator: Draft202012Validator):
    """Verify 404 response matches JSON Schema specification."""
    response = client.get("/api/v1/nonexistent-route")
    assert response.status_code == 404

    data = response.json()
    error_schema_validator.validate(data)

    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "message" in data["error"]
    assert "request_id" in data["error"]
    assert response.headers.get("X-Request-ID") == data["error"]["request_id"]


def test_custom_api_exceptions(error_schema_validator: Draft202012Validator):
    """Verify application-specific domain exceptions conform to envelope."""
    app = create_app()
    app.include_router(error_simulation_router)
    custom_client = TestClient(app)

    # Test Not Found
    res = custom_client.get("/api/v1/test-errors/not-found")
    assert res.status_code == 404
    error_schema_validator.validate(res.json())
    assert res.json()["error"]["code"] == "NOT_FOUND"

    # Test Unauthorized
    res = custom_client.get("/api/v1/test-errors/unauthorized")
    assert res.status_code == 401
    error_schema_validator.validate(res.json())
    assert res.json()["error"]["code"] == "UNAUTHENTICATED"

    # Test Validation
    res = custom_client.get("/api/v1/test-errors/validation-fail")
    assert res.status_code == 422
    error_schema_validator.validate(res.json())
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"
    assert len(res.json()["error"]["details"]) == 1


def test_unhandled_exception_sanitizes_message(
    error_schema_validator: Draft202012Validator,
):
    """Verify unhandled 500 exceptions do not leak stack traces."""
    app = create_app()
    app.include_router(error_simulation_router)
    custom_client = TestClient(app, raise_server_exceptions=False)

    res = custom_client.get("/api/v1/test-errors/unhandled")
    assert res.status_code == 500

    data = res.json()
    error_schema_validator.validate(data)
    assert data["error"]["code"] == "INTERNAL_ERROR"
    # Ensure raw exception message is NOT leaked to clients
    assert "Unexpected internal malfunction" not in data["error"]["message"]
