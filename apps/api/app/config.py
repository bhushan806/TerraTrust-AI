"""Application Configuration Module for FIN-03 Backend."""

from functools import lru_cache
from typing import List, Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """FIN-03 Backend Settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Core Application Settings
    APP_NAME: str = "FIN-03 Agricultural Credit Risk API"
    APP_ENV: Literal["local", "test", "staging", "production"] = "local"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = False

    # Database Configuration
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://fin03:fin03_local_only@localhost:5432/fin03",
        description="Database connection URL",
    )

    # Security & OIDC Settings
    SECRET_KEY: str = Field(
        default="fin03_local_development_secret_key_32_bytes_min!",
        description="Secret key for signing local session/tokens",
    )
    OIDC_ISSUER_URL: str = "http://identity-mock.local"
    OIDC_CLIENT_ID: str = "replace-for-local"
    OIDC_CLIENT_SECRET: str = ""

    # Storage & Model Artifacts
    OBJECT_STORAGE_BUCKET: str = "fin03-local"
    MODEL_ARTIFACT_URI: str = "./artifacts/demo-model.joblib"

    # Observability & Networking
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    REQUEST_TIMEOUT_SECONDS: int = 10
    PROVIDER_API_KEY: str = ""
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("APP_PORT")
    @classmethod
    def validate_port(cls, v: int) -> int:
        if not (1 <= v <= 65535):
            raise ValueError(f"Port must be between 1 and 65535, got {v}")
        return v

    @field_validator("REQUEST_TIMEOUT_SECONDS")
    @classmethod
    def validate_timeout(cls, v: int) -> int:
        if v <= 0:
            raise ValueError(f"Timeout must be positive, got {v}")
        return v


@lru_cache()
def get_settings() -> Settings:
    """Retrieve cached application settings instance."""
    return Settings()
