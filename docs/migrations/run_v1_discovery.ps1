param(
  [string]$Host = "localhost",
  [int]$Port = 3306,
  [string]$User = "root",
  [string]$Password = "",
  [string]$Database = "korfarm_v1",
  [string]$OutDir = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)"
)

$mysql = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysql) {
  throw "mysql client not found in PATH"
}

if (-not (Test-Path $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$tablesOut = Join-Path $OutDir "v1_tables.tsv"
$columnsOut = Join-Path $OutDir "v1_columns.tsv"

$baseArgs = @("--host=$Host", "--port=$Port", "--user=$User", "--database=$Database", "--batch", "--raw")
if ($Password -ne "") {
  $baseArgs += "--password=$Password"
}

$tablesQuery = @"
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY table_name;
"@

$columnsQuery = @"
SELECT table_name, column_name, data_type, is_nullable, column_key, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
ORDER BY table_name, ordinal_position;
"@

& $mysql @baseArgs --execute $tablesQuery | Out-File -FilePath $tablesOut -Encoding ascii
& $mysql @baseArgs --execute $columnsQuery | Out-File -FilePath $columnsOut -Encoding ascii

Write-Host "Wrote: $tablesOut"
Write-Host "Wrote: $columnsOut"
