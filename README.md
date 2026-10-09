# FIN-03: Climate-Aware Agricultural Credit Decision-Support System

## Overview
FIN-03 is an engineering blueprint for an institutional loan officer and risk analyst decision-support system. It combines farm and crop-cycle data, historical weather, seasonal forecasts, satellite crop observations, soil moisture, irrigation, yield history, market prices, and borrower credit history to produce traceable yield and farm-income estimates, climate scenario modeling, and risk-driver explanations.

## Repository Structure
```text
.
├── .github/              # GitHub Actions workflows and issue/PR templates
│   └── workflows/ci.yml  # Contract validation and security baseline CI
├── docs/                 # Complete 26-document engineering blueprint
│   ├── 00-executive-summary.md
│   ├── ...
│   └── 25-glossary-and-onboarding-guide.md
├── packages/             # Monorepo packages & contracts
│   └── contracts/        # Shared OpenAPI schemas and type definitions
├── scripts/              # Validation and maintenance utilities
│   ├── count_endpoints.py
│   └── dataset_audit_template.json
├── docker-compose.yml    # Local development services
├── openapi.yaml          # Full OpenAPI specification (34 MVP / 12 deferred operations)
└── .env.example          # Environment variables template
```

## Documentation
Start with [docs/00-executive-summary.md](docs/00-executive-summary.md). Full architectural decisions, API specs, database schemas, and implementation plans are indexed in [docs/README.md](docs/README.md).
