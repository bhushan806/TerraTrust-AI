"""Tests for configuration management and environment validation."""

import pytest
from pydantic import ValidationError
from app.config import Settings


def test_default_settings():
    """Verify default settings configuration."""
    settings = Settings()
    assert settings.APP_NAME == "FIN-03 Agricultural Credit Risk API"
    assert settings.APP_PORT == 8000
    assert settings.REQUEST_TIMEOUT_SECONDS == 10
    assert "local" in settings.APP_ENV


def test_invalid_port_raises_error():
    """Verify that an invalid port triggers a validation error."""
    with pytest.raises(ValidationError):
        Settings(APP_PORT=99999)

    with pytest.raises(ValidationError):
        Settings(APP_PORT=0)


def test_invalid_timeout_raises_error():
    """Verify that a non-positive timeout triggers validation error."""
    with pytest.raises(ValidationError):
        Settings(REQUEST_TIMEOUT_SECONDS=-5)
