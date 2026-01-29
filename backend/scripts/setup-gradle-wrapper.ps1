$ErrorActionPreference = "Stop"

$gradleVersion = "8.7"
$zipName = "gradle-$gradleVersion-bin.zip"
$zipPath = Join-Path $env:TEMP $zipName
$extractRoot = Join-Path $env:TEMP "gradle-$gradleVersion"
$gradleHome = Join-Path $extractRoot "gradle-$gradleVersion"
$gradleBat = Join-Path $gradleHome "bin\gradle.bat"

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  Write-Error "Java not found. Install JDK 17 and ensure java is in PATH."
}

Invoke-WebRequest -Uri "https://services.gradle.org/distributions/$zipName" -OutFile $zipPath

if (Test-Path $extractRoot) {
  Remove-Item -Recurse -Force $extractRoot
}

Expand-Archive -Path $zipPath -DestinationPath $extractRoot

if (-not (Test-Path $gradleBat)) {
  Write-Error "Gradle not found after extraction."
}

Push-Location "$PSScriptRoot\.."
try {
  & $gradleBat wrapper
} finally {
  Pop-Location
}

Write-Host "Gradle wrapper generated in backend folder."

