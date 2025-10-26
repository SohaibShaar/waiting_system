@echo off
title Queue Management System - Startup
cd /d "%~dp0"

echo ================================================
echo   Queue Management System - Auto Startup
echo ================================================
echo.

REM Start Backend
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%~dp0" && npm run dev"
echo Backend started. Waiting 10 seconds...
timeout /t 10 /nobreak >nul

REM Start Frontend
echo [2/3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d "%~dp0\web" && npm run dev"
echo Frontend started. Waiting 15 seconds for server to be ready...
timeout /t 15 /nobreak >nul

REM Open Chrome in fullscreen
echo [3/3] Opening Chrome in fullscreen mode...
start chrome.exe --start-fullscreen http://localhost:5173

REM Wait for Chrome to open
echo Waiting for Chrome to load...
timeout /t 3 /nobreak >nul

REM Send F11 key to activate fullscreen
echo Pressing F11 for fullscreen mode...
powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.AppActivate('localhost'); Start-Sleep -Milliseconds 500; $wshell.SendKeys('{F11}')"

echo.
echo ================================================
echo   System Started Successfully!
echo ================================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press F11 to exit fullscreen mode
echo Press any key to exit this window...
pause >nul

