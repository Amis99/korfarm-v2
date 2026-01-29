param(
  [string]$OpenApiPath = "$(Resolve-Path \"$PSScriptRoot\\..\\..\\..\\docs\\openapi.yaml\")",
  [string]$SchemaPath = "$(Resolve-Path \"$PSScriptRoot\\..\\json-schemas\\api.schema.json\")"
)

if (-not (Test-Path $OpenApiPath)) {
  throw "OpenAPI not found: $OpenApiPath"
}
if (-not (Test-Path $SchemaPath)) {
  throw "Schema not found: $SchemaPath"
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  throw "python not found in PATH"
}

$script = @'
import json
import sys

openapi_path = sys.argv[1]
schema_path = sys.argv[2]

try:
    import yaml
except Exception as exc:
    print("PyYAML not installed. Run: pip install pyyaml")
    sys.exit(2)

with open(openapi_path, "r", encoding="utf-8") as f:
    openapi = yaml.safe_load(f)

with open(schema_path, "r", encoding="utf-8") as f:
    schema = json.load(f)

openapi_schemas = set((openapi.get("components", {}).get("schemas") or {}).keys())
json_defs = set((schema.get("definitions") or {}).keys())

missing_in_json = sorted(openapi_schemas - json_defs)
missing_in_openapi = sorted(json_defs - openapi_schemas)

if not missing_in_json and not missing_in_openapi:
    print("OK: schemas are in sync")
    sys.exit(0)

if missing_in_json:
    print("Missing in JSON schema:")
    for name in missing_in_json:
        print("  - " + name)

if missing_in_openapi:
    print("Missing in OpenAPI:")
    for name in missing_in_openapi:
        print("  - " + name)

sys.exit(1)
'@

& $python $script $OpenApiPath $SchemaPath
