param(
  [string]$TemplatePath = "$(Resolve-Path \"$PSScriptRoot\\..\\..\\..\\docs\\templates\\kotlin\\ApiDtos.kt\")",
  [Parameter(Mandatory = $true)][string]$DestinationDir
)

if (-not (Test-Path $TemplatePath)) {
  throw "Template not found: $TemplatePath"
}

if (-not (Test-Path $DestinationDir)) {
  New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
}

$dest = Join-Path $DestinationDir "ApiDtos.kt"
Copy-Item -Path $TemplatePath -Destination $dest -Force
Write-Host "Copied to: $dest"
