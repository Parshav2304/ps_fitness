# PowerShell start script for Fitness AI Backend

Write-Host "🚀 Starting PS Fitness Backend..." -ForegroundColor Cyan

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "❌ Virtual environment not found. Please run setup.ps1 first" -ForegroundColor Red
    exit 1
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Check if uvicorn is installed
Write-Host "🔍 Checking uvicorn installation..." -ForegroundColor Yellow
python -c "import uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ uvicorn not found. Installing..." -ForegroundColor Yellow
    pip install uvicorn[standard]
}

# Start the server
Write-Host "`n🌐 Starting server on http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
