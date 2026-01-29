# Shared Contracts

This folder contains shared API contracts to keep backend and frontend aligned.

## JSON Schema
- `json-schemas/api.schema.json` is the canonical schema for core request/response DTOs.
- Use it for validation on ingestion endpoints and for frontend type generation.

## Notes
- Keep schemas in ASCII.
- Extend existing definitions instead of duplicating names.
