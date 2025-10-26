@echo off
title Setup Auto-Start on Windows Boot
echo ================================================
echo   Setup Auto-Start Configuration
echo ================================================
echo.

REM Get the current directory
set CURRENT_DIR=%~dp0
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

echo Current Project Directory: %CURRENT_DIR%
echo Startup Folder: %STARTUP_FOLDER%
echo.

REM Ask user which version to use
echo.
echo Select startup mode:
echo 1. Standard Mode (--start-fullscreen flag)
echo 2. Enhanced Mode (Automatic F11 press)
echo.
choice /C 12 /N /M "Enter your choice (1 or 2): "

if errorlevel 2 (
    set BATCH_FILE=start-system-fullscreen.bat
    echo Selected: Enhanced Mode with F11
) else (
    set BATCH_FILE=start-system.bat
    echo Selected: Standard Mode
)

echo.
REM Create shortcut in Startup folder
echo Creating startup shortcut...
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%STARTUP_FOLDER%\QueueSystem.lnk'); $SC.TargetPath = '%CURRENT_DIR%start-system.vbs'; $SC.WorkingDirectory = '%CURRENT_DIR%'; $SC.Description = 'Queue Management System Auto-Start'; $SC.Save()"

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo   SUCCESS!
    echo ================================================
    echo.
    echo Auto-start has been configured successfully!
    echo The system will now start automatically when Windows boots.
    echo.
    echo To disable auto-start, run: remove-autostart.bat
    echo To test the startup now, run: start-system.bat
    echo.
) else (
    echo.
    echo ERROR: Failed to create startup shortcut.
    echo Please run this script as Administrator.
    echo.
)

pause

