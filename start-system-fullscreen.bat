@echo off
title Queue Management System - Startup with Auto F11
cd /d "%~dp0"

echo ================================================
echo   Queue Management System - Auto Startup
echo   With Automatic Fullscreen (F11)
echo ================================================
echo.

REM Start Backend
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%~dp0" && npm run dev"
echo Backend started. Waiting 10 seconds...
timeout /t 15 /nobreak >nul

REM Start Frontend
echo [2/3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d "%~dp0\web" && npm run dev"
echo Frontend started. Waiting 15 seconds for server to be ready...
timeout /t 15 /nobreak >nul

REM Open Chrome
echo [3/3] Opening Chrome and activating fullscreen...
start chrome.exe --new-window --start-maximized http://localhost:5173/display

REM Wait for Chrome to fully load
echo Waiting for Chrome to load completely...
timeout /t 15 /nobreak >nul

REM Activate Chrome window and send F11
echo Pressing F11 for fullscreen mode...
powershell -ExecutionPolicy Bypass -Command "$null = Add-Type -AssemblyName System.Windows.Forms; $wshell = New-Object -ComObject wscript.shell; Start-Sleep -Milliseconds 1500; $wshell.AppActivate('Chrome'); Start-Sleep -Milliseconds 1500; [System.Windows.Forms.SendKeys]::SendWait('{F11}');"

echo.
echo ================================================
echo   System Started Successfully!
echo ================================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press F11 to toggle fullscreen mode
echo Press any key to exit this window...
pause >nul

