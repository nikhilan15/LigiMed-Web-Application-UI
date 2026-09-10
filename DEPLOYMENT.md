# 🚀 Cloud Deployment Guide: Vercel (Frontend) + Render (Backend API)

This guide provides step-by-step instructions to deploy **LigiMed** with the **React Frontend on Vercel** and the **Node.js Express Backend on Render**.

---

## 🛠️ Step 1: Deploy Backend API to Render.com

1. **Push your code to GitHub** (if not already done).
2. Go to **[Render.com](https://dashboard.render.com)** and sign in.
3. Click **New +** → Select **Web Service**.
4. Connect your GitHub repository: `LigiMed-Web-Application-UI`.
5. Configure the service settings:
   * **Name**: `ligimed-api`
   * **Environment**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm run server`
6. Add **Environment Variables** in Render settings:
   * `PORT` = `10000`
   * `NODE_ENV` = `production`
   * `CORS_ORIGINS` = `*` (or your Vercel URL once generated)
   * *(Optional)* `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` if using a remote MySQL instance (Render MySQL, Aiven, or Railway).
7. Click **Create Web Service**.
8. Copy your live backend URL (e.g. `https://ligimed-api.onrender.com`).

---

## 🌐 Step 2: Deploy Frontend UI to Vercel

1. Go to **[Vercel.com](https://vercel.com)** and sign in.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `LigiMed-Web-Application-UI`.
4. Configure the Framework Preset:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   * **Name**: `VITE_API_BASE_URL`
   * **Value**: `https://ligimed-api.onrender.com/api` (Replace with your Render API URL from Step 1).
6. Click **Deploy**.

---

## ✅ Step 3: Verification

1. Once Vercel finishes building, visit your live Vercel deployment URL (e.g. `https://ligimed-web-app.vercel.app`).
2. Test signing in as a Pharmacy, Wholesale Dealer, or Pharmacist.
3. Open the browser console to verify API calls successfully connect to `https://ligimed-api.onrender.com/api/health`.
