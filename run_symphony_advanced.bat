@echo off
setlocal enabledelayedexpansion

REM Default settings
set HOST=localhost
set PORT=8000
set VENV_PATH=.venv
set NO_FRONTEND=
set SKIP_VENV=
set SKIP_INSTALL=
set SKIP_NPM=

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :end_parse_args
if /i "%~1"=="--host" (
    set HOST=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--venv" (
    set VENV_PATH=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--no-frontend" (
    set NO_FRONTEND=--no-frontend
    shift
    goto :parse_args
)
if /i "%~1"=="--skip-venv" (
    set SKIP_VENV=--skip-venv
    shift
    goto :parse_args
)
if /i "%~1"=="--skip-install" (
    set SKIP_INSTALL=--skip-install
    shift
    goto :parse_args
)
if /i "%~1"=="--skip-npm" (
    set SKIP_NPM=--skip-npm
    shift
    goto :parse_args
)
if /i "%~1"=="--help" (
    echo Symphony Logo Detection System Launcher
    echo.
    echo Usage: run_symphony.bat [options]
    echo.
    echo Options:
    echo   --host HOST           Host interface to bind to (default: localhost)
    echo   --port PORT           Base port for the FastAPI backend (default: 8000)
    echo   --venv VENV_PATH      Path to virtual environment (default: .venv)
    echo   --no-frontend         Run only the backend services without the frontend
    echo   --skip-venv           Skip virtual environment creation/activation
    echo   --skip-install        Skip Python requirements installation
    echo   --skip-npm            Skip npm dependencies installation
    echo   --help                Show this help message and exit
    exit /b 0
)
shift
goto :parse_args
:end_parse_args

echo Starting Symphony Logo Detection System...

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH. Please install Python 3.7 or higher.
    pause
    exit /b 1
)

REM Build the command with all options
set CMD=python run_symphony.py --host %HOST% --port %PORT%

if defined NO_FRONTEND set CMD=%CMD% %NO_FRONTEND%
if defined SKIP_VENV set CMD=%CMD% %SKIP_VENV%
if defined SKIP_INSTALL set CMD=%CMD% %SKIP_INSTALL%
if defined SKIP_NPM set CMD=%CMD% %SKIP_NPM%
if not "%VENV_PATH%"==".venv" set CMD=%CMD% --venv %VENV_PATH%

REM Run the Symphony Logo Detection System
echo Executing: %CMD%
%CMD%

REM If the script exits, pause to see any error messages
pause