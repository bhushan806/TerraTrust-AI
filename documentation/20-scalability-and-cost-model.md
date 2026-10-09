# Scalability and Cost Model

## Start simple
A modular monolith, PostgreSQL, one worker and object storage are sufficient for a pilot unless measurements prove otherwise. Do not introduce Kubernetes or microservices just because the product has distinct modules.

## Triggers for change
- Add Redis/Celery or managed queue when DB-backed job polling/locking is a measured bottleneck, jobs need delayed scheduling/retries at scale, or worker concurrency risks DB contention.
- Separate ML inference service when dependency isolation, GPU/resource needs, release cadence or independent scaling requires it.
- Add cache when measured repeated reads dominate latency and invalidation can be defined safely.
- Split a domain service only when independent deployment/scale/ownership benefits exceed operational cost and network failure complexity.
- Add PostGIS when actual spatial filtering/intersection or map features require it; use geometry validation and suitable indexes.

## Cost categories
Application compute; managed PostgreSQL and backups; object storage and egress; logging/metrics/tracing retention; identity provider; CI minutes/artifact storage; vulnerability scanning; weather/satellite/market provider fees; data licensing; support and incident response. Provider costs depend on region, data volume, uptime, retention and commercial terms.

## Planning bands
- Local: near-zero infrastructure spend, excluding developer machines and paid data/API access.
- Demo: one small app host + small managed database + modest object storage/logs; use a planning placeholder of tens to a few hundred USD/month, not a quote.
- Production: HA database, multi-instance compute, stronger observability, backups, security controls, provider fees and support can raise cost substantially. Obtain region-specific quotes and test volume assumptions before approval.

## Capacity test inputs
Agree expected institutions/users, concurrent sessions, plots per borrower, observations per plot, assessment requests/day, forecast refresh frequency, report size, retention and target p95. Benchmark CRUD and assessment workflows, DB indexes, worker throughput and provider quotas. Scale from measurements, not guessed user counts.
