import sys
import os
import uvicorn

# Force current directory into path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print(f"DEBUG: Running from {os.getcwd()}")
print(f"DEBUG: sys.path[0] is {sys.path[0]}")

if __name__ == "__main__":
    try:
        from app.main import app
        print("DEBUG: Successfully imported app.main locally")
    except ImportError as e:
        print(f"DEBUG: Failed to import app.main: {e}")
        
    print("DEBUG: Starting Uvicorn programmatically...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
