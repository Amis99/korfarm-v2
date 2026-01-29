param(
  [string]$OpenApiPath = "$(Resolve-Path \"$PSScriptRoot\\..\\..\\..\\docs\\openapi.yaml\")",
  [string]$OutPath = "$(Resolve-Path \"$PSScriptRoot\\..\")\\openapi-types.d.ts"
)

if (-not (Test-Path $OpenApiPath)) {
  throw "OpenAPI not found: $OpenApiPath"
}

$npx = Get-Command npx -ErrorAction SilentlyContinue
if (-not $npx) {
  throw "npx not found in PATH"
}

Write-Host "Generating types from $OpenApiPath"
& $npx openapi-typescript $OpenApiPath -o $OutPath
if ($LASTEXITCODE -ne 0) {
  throw "openapi-typescript failed"
}

Write-Host "Generated: $OutPath"
