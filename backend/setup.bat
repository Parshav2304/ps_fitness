@echo off
echo Setting up PS Fitness Backend...

REM Check if Python is installed
python --version
if errorlevel 1 (
    echo Python is not installed or not in PATH!
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Setup complete!
echo.
echo To start the server, run:
echo   start.bat
echo.
pause
