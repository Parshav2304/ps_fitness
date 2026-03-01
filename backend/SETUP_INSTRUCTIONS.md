# 🚀 Backend Setup Instructions

## Quick Setup (Windows)

### Option 1: Using PowerShell Script (Recommended)

1. **Open PowerShell** in the `backend` folder
2. **Run setup script**:
   ```powershell
   .\setup.ps1
   ```
3. **Start the server**:
   ```powershell
   .\start.ps1
   ```

### Option 2: Using Batch File

1. **Double-click** `start.bat` in the backend folder
2. If virtual environment doesn't exist, it will guide you

### Option 3: Manual Setup

1. **Open Command Prompt or PowerShell** in the `backend` folder

2. **Create virtual environment**:
   ```cmd
   python -m venv venv
   ```

3. **Activate virtual environment**:
   ```cmd
   venv\Scripts\activate
   ```
   (You should see `(venv)` in your prompt)

4. **Upgrade pip**:
   ```cmd
   python -m pip install --upgrade pip
   ```

5. **Install dependencies**:
   ```cmd
   pip install -r requirements.txt
   ```

6. **Create .env file** (if not exists):
   ```cmd
   echo MONGODB_URL=mongodb://localhost:27017 > .env
   echo DATABASE_NAME=fitness_ai >> .env
   echo SECRET_KEY=your-secret-key-change-this-in-production >> .env
   ```

7. **Start the server**:
   ```cmd
   uvicorn app.main:app --reload
   ```

## Troubleshooting

### "python is not recognized"
- Install Python 3.8+ from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation
- Restart your terminal after installation

### "uvicorn is not recognized"
- Make sure virtual environment is activated (you should see `(venv)` in prompt)
- Run: `pip install uvicorn[standard]`

### "Module not found" errors
- Activate virtual environment: `venv\Scripts\activate`
- Install dependencies: `pip install -r requirements.txt`

### PowerShell Execution Policy Error
If you get "execution of scripts is disabled", run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### MongoDB Connection Error
- Make sure MongoDB is running
- Check MongoDB connection string in `.env` file
- For local MongoDB: `mongodb://localhost:27017`
- For Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/fitness_ai`

## Verify Installation

After setup, you should be able to:
1. See `(venv)` in your terminal prompt
2. Run `uvicorn --version` successfully
3. Access http://localhost:8000/docs when server is running

## Next Steps

1. ✅ Backend is running on http://localhost:8000
2. ✅ Open another terminal for frontend
3. ✅ Go to `frontend` folder
4. ✅ Run `npm install` then `npm start`

## Need Help?

- Check `MONGODB_SETUP.md` for database setup
- Check `README.md` for full documentation
- Check `PRODUCTION_READY.md` for production setup
