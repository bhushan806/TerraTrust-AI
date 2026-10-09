# FIN-03 Backend Service (`apps/api`)

FastAPI modular monolith backend for the **FIN-03 Agricultural Climate-Aware Credit Risk Assessment System**.

## Features & Standards

- **FastAPI** with Python 3.12+ and Pydantic v2.
- **Strict Error Envelope**: Conforms to `packages/contracts/schemas/error.schema.json`.
- **Request Tracing**: Automated `X-Request-ID` injection and latency timing.
- **Structured JSON Logging**: Secret and credential redaction on all log records.
- **OpenAPI 3.1 Contract**: Endpoints align with root `openapi.yaml`.

## Getting Started Locally

### 1. Prerequisites
- Python 3.12+
- Docker and Docker Compose (optional for local standalone execution)
- PostgreSQL 16 (or local test database)

### 2. Environment Setup
```bash
# From repository root
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r apps/api/requirements.txt
```

### 3. Running the Server
```bash
# Run using uvicorn from apps/api directory
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Or with PYTHONPATH set from repository root:
```bash
python -m uvicorn apps.api.app.main:app --reload --port 8000
```

### 4. Database Migrations & Seeding
```bash
# Run migrations using Alembic
cd apps/api
alembic upgrade head

# Seed initial development data
python -c "from app.db.session import SessionLocal; from app.db.seed import seed_database; db = SessionLocal(); print(seed_database(db)); db.close()"
```

### 5. Running Automated Tests
```bash
# From repository root
pytest -v
```

### 6. Health Endpoints
- Readiness check (API-034): `GET http://localhost:8000/api/v1/health/ready`
- Liveness check: `GET http://localhost:8000/api/v1/health/live`
- Interactive OpenAPI Docs: `http://localhost:8000/api/v1/docs`
