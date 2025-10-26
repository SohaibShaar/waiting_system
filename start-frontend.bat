@echo off
cd /d "%~dp0\web"
echo Starting Frontend Server...
start cmd /k "npm run dev"

