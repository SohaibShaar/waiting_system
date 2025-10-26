@echo off
title Remove Auto-Start from Windows Boot
echo ================================================
echo   Remove Auto-Start Configuration
echo ================================================
echo.

set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

if exist "%STARTUP_FOLDER%\QueueSystem.lnk" (
    del "%STARTUP_FOLDER%\QueueSystem.lnk"
    echo Auto-start has been removed successfully!
    echo The system will no longer start automatically when Windows boots.
) else (
    echo Auto-start shortcut not found.
    echo The system is not configured to start automatically.
)

echo.
pause

