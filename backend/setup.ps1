# PowerShell setup script for Fitness AI Backend

Write-Host "🚀 Setting up Fitness AI Backend..." -ForegroundColor Cyan

# Check Python
Write-Host "`n📋 Checking Python installation..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host "`n📦 Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "⚠️ Virtual environment already exists" -ForegroundColor Yellow
} else {
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "`n🔧 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "`n⬆️ Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Setup complete!" -ForegroundColor Green
    Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure MongoDB is running" -ForegroundColor White
    Write-Host "2. Create .env file with MongoDB connection string" -ForegroundColor White
    Write-Host "3. Run: .\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "4. Run: uvicorn app.main:app --reload" -ForegroundColor White
} else {
    Write-Host "`n❌ Setup failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
