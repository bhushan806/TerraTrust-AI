# Shared contracts

JSON schemas in this directory are contract artifacts. `openapi.yaml` is the API source of truth; update schemas/examples together and validate them in CI. The yield response schema intentionally permits `value: null` when model readiness/data gates fail.
