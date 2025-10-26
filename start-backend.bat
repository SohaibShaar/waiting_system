@echo off
cd /d "%~dp0"
echo Starting Backend Server...
start cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

