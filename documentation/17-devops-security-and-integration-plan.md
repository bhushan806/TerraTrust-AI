# Platform, DevOps, Security and Integration — Member 4

## Concrete ownership
Member 4 writes Dockerfiles/Compose, CI workflow, environment validation, deployment manifests, scanning configuration, health/metrics instrumentation, test orchestration, contract-check scripts, E2E smoke suite, backup/restore runbook and release checklist. This is implementation ownership, not only review.

## Environments
- Local: synthetic data, mock provider adapters, `.env.example`, Docker Compose.
- CI: ephemeral test DB, unit/contract/integration/security checks.
- Staging: synthetic or approved de-identified data, same image artifact intended for production.
- Production: managed secrets, private DB network, TLS, backups, restricted operator access, monitoring and change approvals.

## Security baseline
- OIDC-based identity; MFA for privileged roles where supported; short-lived credentials; secure cookie/session configuration or carefully scoped bearer tokens.
- Deny-by-default RBAC plus tenant and branch object authorization on every request.
- Secrets from secret manager/environment injection; never in repo, image, logs or frontend bundle.
- TLS in transit and encryption at rest through managed services; encrypted backups; key access reviewed.
- Validate uploads by size, content type, schema and malware scanning where appropriate; store outside web root.
- SSRF protection: fixed provider allowlist; no arbitrary URL fetch from user input.
- Rate limits on auth, imports, reports and assessment creation; request size/timeouts.
- Audit privileged changes and assessment lifecycle; redact personal/financial details from logs.
- Dependency, secret, SAST and container scans; patch policy; threat model and abuse cases.

## CI pull-request gates
1. Format/lint/type-check web, API and ML.
2. Unit tests.
3. API schema and ML contract validation.
4. Migration validation and integration tests against PostgreSQL.
5. Frontend build and E2E smoke tests on core flow.
6. Dependency/secret/static-analysis/container scans.
7. Fail merge for failing tests, exposed secret, critical vulnerability or unauthorized contract drift. Define a reviewed exception process for false positives; never silently ignore.

## Deployment and rollback
Build immutable tagged images; scan; publish; deploy to staging; run migrations using a controlled one-off job; smoke test health and core read workflow; require approval for production; deploy same tested artifact; verify metrics/error rate; rollback app image and model pointer if unhealthy. Database migrations should be backward-compatible across deploy window; destructive migrations require staged expand/migrate/contract approach.

## Privacy/legal research workstream (India)
Obtain counsel/compliance review of the Digital Personal Data Protection Act, 2023 and applicable rules/commencement notifications; RBI directions/guidance relevant to the actual lender/product relationship; credit information company requirements if bureau data is used; outsourcing/cloud/security requirements where applicable; contractual provider licenses; consent/notice, purpose limitation, retention, access and grievance obligations. Applicability depends on entity, data flow and current law. This document is not legal advice and does not assert that every listed regime applies.

## Observability and recovery
Structured logs with request/job IDs; metrics for provider latency/error, job age/failure, inference latency, stale input rate, API latency and auth denials; trace provider/ML spans without sensitive payloads. Liveness checks process; readiness checks required dependencies with safe output. Set backup schedule/RPO/RTO with product owner; test restore to isolated environment; document key rotation and incident response.
