# Production Readiness Checklist

## Product/data
- [ ] Supported crops/regions/horizons documented; out-of-domain behavior tested.
- [ ] Required reference datasets audited; licenses/terms recorded.
- [ ] Every source has owner, license, refresh policy, provenance and fallback.
- [ ] Missing/stale data statuses are visible and tested.
- [ ] Yield model card includes target, data, splits, metrics, limitations and approved domain.
- [ ] Repayment probability disabled unless labels and all model gates are approved.
- [ ] Human review and override policy approved by lender.

## Security/privacy
- [ ] Threat model reviewed; tenant/branch negative tests pass.
- [ ] Identity, MFA policy for privileged access, session/token controls reviewed.
- [ ] TLS, encryption at rest/backups, secrets manager and rotation configured.
- [ ] Logs redact credentials and unnecessary PII/financial data.
- [ ] Upload validation, rate limits, SSRF protections and dependency scans enabled.
- [ ] Applicable Indian privacy/financial requirements reviewed by qualified counsel/compliance.
- [ ] Retention/deletion, access requests, incident response and audit policy documented.

## Operations
- [ ] CI/CD merge and release gates enforced.
- [ ] Staging smoke/E2E and production deployment approval process exercised.
- [ ] Migrations backward-compatible; rollback procedure tested.
- [ ] Monitoring dashboards, actionable alerts, owners and runbooks exist.
- [ ] Backup restore test passes; RPO/RTO approved.
- [ ] Load test passes agreed traffic and latency SLO.
- [ ] Provider outage, ML timeout and queue backlog tested.
- [ ] Model/artifact checksums and rollback pointers retained.

## User experience/governance
- [ ] Accessibility and responsive checks complete.
- [ ] Every result shows units, timestamp, source/model version, quality and limitations.
- [ ] Reports match immutable saved assessment snapshots.
- [ ] No demo/illustrative output can be mistaken for a validated credit probability.
- [ ] User training and support escalation process ready.
