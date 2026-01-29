# Contracts Pipeline

This project keeps API contracts in three layers:

1) `docs/openapi.yaml` is the canonical API surface.
2) `shared/contracts/json-schemas/api.schema.json` holds DTO validation schemas.
3) `shared/contracts/types.ts` provides frontend-safe types.

## Update flow
1) Change `docs/openapi.yaml` first.
2) Mirror DTO changes into `shared/contracts/json-schemas/api.schema.json`.
3) Update `shared/contracts/types.ts` if types changed.

## Validation
- Validate JSON schemas before using them in ingestion.
- Treat schema updates as breaking changes when fields become required or types change.

## Suggested tooling (optional)
- openapi-typescript for frontend type generation.
- ajv for JSON schema validation in backend.

## Sync check
Run: `shared/contracts/scripts/check-sync.ps1`

## Type generation
- Frontend types: `shared/contracts/scripts/generate-openapi-types.ps1`
- Kotlin DTO copy: `shared/contracts/scripts/copy-kotlin-dtos.ps1 -DestinationDir <path>`
