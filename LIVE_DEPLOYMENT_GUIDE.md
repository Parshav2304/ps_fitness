# ☁️ Live Cloud Deployment Guide

This guide provides a comprehensive, step-by-step walkthrough to deploy the PS Fitness application live on the internet. We will use a modern, free-tier friendly stack: **MongoDB Atlas** for the database, **Render.com** for the Python backend, and **Vercel** for the React frontend.

---

## 🗄️ Phase 1: Database (MongoDB Atlas)
Your backend needs a database that lives on the cloud, rather than your local computer.

1. **Create an Account:** Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up.
2. **Create a Free Cluster:**
   - Once logged in, click **Build a Database** and select the **FREE** (M0) tier.
   - Choose a cloud provider (AWS/Google Cloud) and a region closest to you. Click **Create**.
3. **Set Up Database Credentials:**
   - You will be prompted to create a database user.
   - Enter a username (e.g., `admin`) and a password (e.g., `password123`). 
   - *Save this password somewhere safe!* Click "Create User".
4. **Configure Network Access:**
   - In the left sidebar, click **Network Access**.
   - Click **Add IP Address**.
   - Choose **Allow Access From Anywhere** (`0.0.0.0/0`) so your Render backend can connect to it. Click Confirm.
5. **Get the Connection String:**
   - Go back to **Database** on the left menu.
   - Click the **Connect** button on your cluster.
   - Choose **Drivers** (Python).
   - Copy the connection string provided. It will look like this: `mongodb+srv://admin:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
   - *Note: Replace `<password>` with the password you created in Step 3.*

---

## ⚙️ Phase 2: Backend (Render.com)
Now we deploy the FastAPI Python server.

1. **Push to GitHub:** Ensure all your latest code, including the `backend` folder, is pushed to your GitHub repository.
2. **Create a Render Account:** Go to [Render.com](https://render.com/) and sign up using your GitHub account.
3. **Create a Web Service:**
   - On the Render dashboard, click **New +** and select **Web Service**.
   - Connect your GitHub repository.
4. **Configure the Web Service:** Fill in the settings exactly as follows:
   - **Name:** `ps-fitness-api` (or any name you prefer)
   - **Root Directory:** `backend` *(Crucial: this tells Render where the Python code lives)*
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. **Set Environment Variables:**
   - Scroll down to the **Environment Variables** section and click "Add Environment Variable".
   - **Key:** `MONGODB_URL`
   - **Value:** *(Paste your MongoDB Atlas connection string from Phase 1 here)*
6. **Deploy:** Click **Create Web Service**. Wait a few minutes for Render to build and launch it.
7. **Get your API URL:** Once it says "Deploy Live", copy the URL provided at the top left (e.g., `https://ps-fitness-api.onrender.com`).

---

## 🎨 Phase 3: Frontend (Vercel)
Finally, we host the React user interface. Vercel is specifically highly optimized for React applications.

1. **Create Vercel Account:** Go to [Vercel.com](https://vercel.com/) and sign in with GitHub.
2. **Import Project:**
   - Click **Add New...** -> **Project**.
   - Find your GitHub repository in the list and click **Import**.
3. **Configure the Project:** 
   - **Project Name:** `ps-fitness`
   - **Framework Preset:** Select **Create React App**.
   - **Root Directory:** Click "Edit", select the `frontend` folder, and click Continue.
4. **Set Environment Variables:**
   - Expand the **Environment Variables** dropdown.
   - **Name:** `REACT_APP_API_URL`
   - **Value:** *(Paste the Render Backend URL you copied at the end of Phase 2)*
   - Click **Add**.
5. **Deploy:** Click the big **Deploy** button.
6. **Go Live:** Vercel will install dependencies, build your static files, and provide you with a live, clickable link to your functioning frontend!

🎉 **Congratulations! Your project is now entirely live and ready for your Hackathon Submission!**
