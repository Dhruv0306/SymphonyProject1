@echo off
echo Starting Symphony Logo Detection System...

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH. Please install Python 3.7 or higher.
    pause
    exit /b 1
)

REM Set environment variables
set VENV_PATH=.venv
set HOST=localhost
set PORT=8000

REM Run the Symphony Logo Detection System
python run_symphony.py --host %HOST% --port %PORT%

REM If the script exits, pause to see any error messages
pause