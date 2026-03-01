# ⚡ Quick Start Guide

## 🚀 Start the Backend (Easiest Way)

### Option 1: Use the Batch File (Windows)
1. **Double-click** `start.bat` in the `backend` folder
2. The server will start automatically!

### Option 2: Use PowerShell Script
1. **Right-click** in `backend` folder → "Open PowerShell here"
2. Run: `.\start.ps1`

### Option 3: Manual Commands
```powershell
# Navigate to backend folder
cd E:\fitness\app_details\backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start server
uvicorn app.main:app --reload
```

## ✅ Verify It's Working

1. Open browser: http://localhost:8000
2. You should see: `{"status":"healthy","message":"Fitness AI API is running","version":"2.0.0"}`
3. API Docs: http://localhost:8000/docs

## 🔧 If You Get Errors

### "uvicorn is not recognized"
**Solution**: Make sure virtual environment is activated
```powershell
.\venv\Scripts\Activate.ps1
```

### "Module not found"
**Solution**: Install dependencies
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### MongoDB Connection Error
**Solution**: 
1. Install MongoDB (see `MONGODB_SETUP.md`)
2. Or use MongoDB Atlas (cloud - free)
3. Update `.env` file with connection string

## 📝 Create .env File

Create `backend/.env`:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=fitness_ai
SECRET_KEY=your-secret-key-change-this-in-production-minimum-32-characters
```

## 🎯 Next Steps

1. ✅ Backend running on http://localhost:8000
2. ✅ Open new terminal
3. ✅ Go to `frontend` folder
4. ✅ Run `npm install` then `npm start`

## 💡 Tips

- Keep the backend terminal open while developing
- The `--reload` flag auto-restarts on code changes
- Check http://localhost:8000/docs for API documentation
- All endpoints require authentication (except `/auth/register` and `/auth/login`)
