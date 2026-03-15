# 🚀 Fitness AI Capstone - Launch & Deployment Guide

**Professional Deployment Strategy for "Perfect App"**

This guide covers how to launch the application locally for your presentation and how to deploy it to the web for a live demo.

## 🏁 Quick Start: Local Presentation (Best for Demo Day)
*Use this for the most reliable performance during your presentation.*

### 1. Start the Database (MongoDB)
Ensure MongoDB is running locally.
```bash
# If installed as a service, it should be running.
# To verify:
mongosh
```

### 2. Start the AI Backend
Open a new terminal:
```bash
cd backend
# Windows
venv\Scripts\activate
# Start Server
uvicorn app.main:app --reload
```
*Wait until you see: `Application startup complete`*

### 3. Start the Premium Frontend
Open a new terminal:
```bash
cd frontend
npm start
```
*The app will open at `http://localhost:3000`*

---

## ☁️ Cloud Deployment (For "Live" Submission)

### 1. Database (MongoDB Atlas)
1.  Go to [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Create a **Free Cluster**.
3.  Create a database user (e.g., `admin`, password `password123`).
4.  Network Access: Allow IP `0.0.0.0/0` (Allow from anywhere).
5.  Get the connection string: `mongodb+srv://admin:<password>@cluster0.mongodb.net/fitness_ai`

### 2. Backend (Render.com)
1.  Push your code to GitHub.
2.  Go to [Render.com](https://render.com/).
3.  New **Web Service** -> Connect your GitHub repo.
4.  **Root Directory**: `backend`
5.  **Build Command**: `pip install -r requirements.txt`
6.  **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
7.  **Environment Variables**:
    *   `MONGODB_URL`: (Paste your Atlas connection string from step 1)

### 3. Frontend (Vercel)
1.  Go to [Vercel](https://vercel.com).
2.  **Add New Project** -> Import from GitHub.
3.  **Root Directory**: `frontend`
4.  **Framework Preset**: Create React App.
5.  **Environment Variables**:
    *   `REACT_APP_API_URL`: (Paste your Render Backend URL, e.g., `https://fitness-api.onrender.com`)
6.  Click **Deploy**.

---

## 🏆 Presentation Features to Highlight
When presenting to the judges, mention these advanced "Professional" features:

1.  **Microservices Architecture**: Separate Frontend (React) and Backend (FastAPI).
2.  **AI/ML Integration**: Highlight the `app/ml` folder where the XGBoost model lives.
3.  **Scalability**: MongoDB (NoSQL) allows for handling massive user data.
4.  **Security**: JWT (JSON Web Tokens) used for authenticating users.
5.  **Premium UI**: Glassmorphism design system for modern aesthetics.
