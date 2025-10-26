@echo off
title Queue Management System - Ultimate Fullscreen
cd /d "%~dp0"

echo ================================================
echo   Queue Management System - Ultimate Edition
echo   Maximum Fullscreen Experience
echo ================================================
echo.

REM Start Backend
echo [1/4] Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%~dp0" && npm run dev"
echo Backend started. Waiting 10 seconds...
timeout /t 10 /nobreak >nul

REM Start Frontend
echo [2/4] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d "%~dp0\web" && npm run dev"
echo Frontend started. Waiting 15 seconds for server to be ready...
timeout /t 15 /nobreak >nul

REM Open Chrome in kiosk mode (TRUE fullscreen)
echo [3/4] Opening Chrome in Kiosk Mode (True Fullscreen)...
start chrome.exe --kiosk http://localhost:5173

echo.
echo [4/4] Chrome opened in KIOSK mode (Ultimate Fullscreen!)
echo.
echo ================================================
echo   System Started Successfully!
echo ================================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Chrome is now in KIOSK mode (True Fullscreen)
echo To exit: Press Alt+F4 or Ctrl+W
echo.
echo Press any key to exit this window...
pause >nul

