@echo off
cd /d "%~dp0"
title PS Fitness - Launcher
color 0A

set "ROOT=%~dp0"
set "BACKEND=%~dp0backend"
set "FRONTEND=%~dp0frontend"

echo ========================================
echo   PS Fitness - Starting All Services
echo ========================================
echo.

REM ── Check Python is installed ──
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found! Please install Python 3.10+
    pause
    exit /b 1
)

REM ── Check Node/npm is installed ──
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)

REM ── Check .env file exists ──
if not exist "%BACKEND%\.env" (
    echo [ERROR] Missing backend\.env file!
    echo Please create it with your API keys. See README.md
    echo.
    pause
    exit /b 1
)

REM ── Create venv if missing ──
if not exist "%BACKEND%\venv\Scripts\activate.bat" (
    echo [SETUP] Creating Python virtual environment...
    cd /d "%BACKEND%"
    python -m venv venv
    echo [SETUP] Installing backend packages ^(first time, ~2 min^)...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd /d "%ROOT%"
    echo [OK] Backend ready!
    echo.
) else (
    echo [OK] Python venv found.
)

REM ── Install node_modules if missing ──
if not exist "%FRONTEND%\node_modules" (
    echo [SETUP] Installing frontend packages ^(first time, ~2 min^)...
    cd /d "%FRONTEND%"
    npm install
    cd /d "%ROOT%"
    echo [OK] Frontend ready!
    echo.
) else (
    echo [OK] Node modules found.
)

echo.
echo [START] Launching Backend...
start "PS Fitness - Backend" cmd /k "cd /d %BACKEND% && call venv\Scripts\activate.bat && python run_server.py"

echo [WAIT]  Giving backend 5 seconds to start...
timeout /t 5 /nobreak >nul

echo [START] Launching Frontend...
start "PS Fitness - Frontend" cmd /k "cd /d %FRONTEND% && npm start"

echo.
echo ========================================
echo   SUCCESS! Services are starting...
echo   Backend  --   http://localhost:8000
echo   Frontend --   http://localhost:3000
echo ========================================
echo.
echo Browser will open automatically.
echo You can now close this window.
echo.
pause
