@echo off
cd /d "%~dp0"
call gradlew.bat bootRun --no-daemon
