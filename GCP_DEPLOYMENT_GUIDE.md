# Deploying PS Fitness on Google Cloud Platform (GCP)

This guide provides step-by-step instructions for deploying both the Frontend (React) and Backend (FastAPI) of PS Fitness on **Google Cloud Run**, a managed platform for deploying containerized applications.

## 🏗️ Architecture Overview
*   **Backend:** Containerized FastAPI app running on Cloud Run.
*   **Frontend:** Containerized React app served by Nginx on Cloud Run.
*   **Database:** MongoDB Atlas (AWS or Google Cloud region).

---

## 🛠️ Prerequisites
1.  **Google Cloud Account:** Sign up at [cloud.google.com](https://cloud.google.com/).
2.  **Google Cloud CLI (`gcloud`):** Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) on your machine.
3.  **Docker:** Ensure [Docker](https://www.docker.com/products/docker-desktop) is installed locally (optional, but good for local testing).
4.  **MongoDB Atlas Database URL:** Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and get your connection string.

---

## 🚀 Step 1: GCP Registration and Setup

1.  Open your terminal and authenticate `gcloud`:
    ```bash
    gcloud auth login
    ```
2.  Set up a new Google Cloud Project (or use an existing one):
    ```bash
    gcloud projects create ps-fitness-deploy --name="PS Fitness Production"
    gcloud config set project ps-fitness-deploy
    ```
3.  Enable critical APIs:
    ```bash
    gcloud services enable run.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    ```

---

## ⚙️ Step 2: Deploying the Backend (FastAPI)

We will use Google Cloud Build to create the Docker image and deploy it directly to Cloud Run.

1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Deploy using a single command using Google Cloud Run:
    ```bash
    gcloud run deploy ps-fitness-backend \
      --source . \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="MONGODB_URL=YOUR_MONGODB_ATLAS_URL,DATABASE_NAME=fitness_ai,SECRET_KEY=YOUR_JWT_SECRET,GEMINI_API_KEY=YOUR_GEMINI_KEY"
    ```
    *Replace `YOUR_MONGODB_ATLAS_URL`, `YOUR_JWT_SECRET`, and `YOUR_GEMINI_KEY` with your actual production credentials.*
3.  Once finished, the terminal will give you a **Service URL** (e.g., `https://ps-fitness-backend-xxx.run.app`). **Save this URL!**

---

## 🎨 Step 3: Deploying the Frontend (React)

I have already created a `Dockerfile` inside your `frontend` directory that uses Nginx to serve your built React files.

1.  Before deploying, you need to tell your frontend how to reach the new backend. Go to your frontend code (typically a `.env` file or `src/api.js`) and update the base API URL to the **Backend Service URL** you just received.
2.  Navigate to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
3.  Deploy using Cloud Run seamlessly:
    ```bash
    gcloud run deploy ps-fitness-frontend \
      --source . \
      --region us-central1 \
      --allow-unauthenticated \
      --port 8080
    ```
4.  Once deployed, it will output your **Frontend Service URL** (e.g., `https://ps-fitness-frontend-xxx.run.app`).

## 🎉 Step 4: Finalizing & Testing

1.  Go to the Google Cloud Console -> **Cloud Run**.
2.  Select `ps-fitness-frontend` and click the URL. Your application is now live on the internet! 
3.  *Note:* Make sure you whitelist `0.0.0.0/0` in MongoDB Atlas Network Access so that Cloud Run can connect to your database.
