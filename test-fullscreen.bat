@echo off
title Test Fullscreen Mode
echo ================================================
echo   Testing Chrome Fullscreen with F11
echo ================================================
echo.

echo Opening Chrome...
start chrome.exe --new-window --start-maximized http://localhost:5173

echo Waiting 5 seconds for page to load...
timeout /t 5 /nobreak

echo Pressing F11 to activate fullscreen...
powershell -ExecutionPolicy Bypass -File "%~dp0press-f11.ps1"

echo.
echo Test complete!
echo If fullscreen didn't activate, you may need to press F11 manually.
echo.
pause

