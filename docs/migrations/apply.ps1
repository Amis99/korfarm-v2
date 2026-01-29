param(
  [string]$Host = "localhost",
  [int]$Port = 3306,
  [string]$User = "root",
  [string]$Password = "",
  [string]$Database = "korfarm",
  [string]$MigrationsPath = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)"
)

$mysql = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysql) {
  throw "mysql client not found in PATH"
}

$files = Get-ChildItem -Path $MigrationsPath -Filter "*.sql" | Where-Object { $_.Name -notlike "v1_*" } | Sort-Object Name
if (-not $files) {
  throw "no .sql files found in $MigrationsPath"
}

$baseArgs = @("--host=$Host", "--port=$Port", "--user=$User", "--database=$Database")
if ($Password -ne "") {
  $baseArgs += "--password=$Password"
}

foreach ($file in $files) {
  Write-Host ("Applying: " + $file.Name)
  & $mysql @baseArgs --execute ("source " + $file.FullName.Replace("\", "/"))
  if ($LASTEXITCODE -ne 0) {
    throw "failed: $($file.Name)"
  }
}
