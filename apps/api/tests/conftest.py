"""Pytest fixtures for FIN-03 Backend testing."""

import json
from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from app.config import Settings, get_settings
from app.db.seed import seed_database
from app.db.session import get_db
from app.main import create_app
from app.models.base import Base


@pytest.fixture(scope="session")
def error_schema_validator() -> Draft202012Validator:
    """Load JSON Schema validator for standard API error envelope."""
    schema_path = (
        Path(__file__).resolve().parents[3]
        / "packages"
        / "contracts"
        / "schemas"
        / "error.schema.json"
    )
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    return Draft202012Validator(schema)


@pytest.fixture
def test_settings() -> Settings:
    """Test environment settings with in-memory SQLite database."""
    return Settings(
        APP_ENV="test",
        DATABASE_URL="sqlite:///:memory:",
        LOG_LEVEL="DEBUG",
        SECRET_KEY="test-secret-key-fin03-secure-jwt-signing-minimum-32-chars",
    )


@pytest.fixture
def test_db_engine():
    """Create an in-memory SQLite engine with StaticPool sharing state across sessions."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def test_session_factory(test_db_engine):
    """Sessionmaker factory bound to test database engine."""
    return sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)


@pytest.fixture
def test_db_session(test_session_factory) -> Generator[Session, None, None]:
    """Test session for assertions and direct database setup in test functions."""
    session = test_session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def seeded_db_session(test_session_factory, test_db_session: Session) -> Session:
    """Seed test database and return active session for test queries."""
    seed_database(test_db_session)
    return test_db_session


@pytest.fixture
def client(test_settings: Settings, test_session_factory) -> Generator[TestClient, None, None]:
    """Test client configured with unseeded test database."""
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: test_settings

    def override_get_db():
        session = test_session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def seeded_client(
    test_settings: Settings, test_session_factory, seeded_db_session: Session
) -> Generator[TestClient, None, None]:
    """Test client configured with seeded test database."""
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: test_settings

    def override_get_db():
        session = test_session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
