# Type Generation

This project keeps contracts in `docs/openapi.yaml` and provides a script to generate frontend types.

## Generate OpenAPI Types (frontend)
Command:
- `shared/contracts/scripts/generate-openapi-types.ps1`

Output:
- `shared/contracts/openapi-types.d.ts`

Notes:
- Requires Node.js and `npx`.
- `npx` will download `openapi-typescript` if it is not installed.
