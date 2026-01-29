param(
  [string]$SchemaPath = "$(Resolve-Path \"$PSScriptRoot\\..\\json-schemas\\api.schema.json\")"
)

if (-not (Test-Path $SchemaPath)) {
  throw "Schema not found: $SchemaPath"
}

$null = Get-Content $SchemaPath -Raw | ConvertFrom-Json
Write-Host "Schema OK: $SchemaPath"
