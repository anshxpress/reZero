# Deployment Guide - Re-Zero AI Framework

This guide provides step-by-step instructions for deploying the Re-Zero AI Framework to a production environment. We recommend using **MongoDB Atlas** for the database, **Render** for the backend, and **Vercel** for the frontend.

## 1. Database Setup (MongoDB Atlas)

> [!IMPORTANT]
> **Free Tier Selection**: MongoDB Atlas has a **forever free** tier called **M0 Sandbox**. The UI defaults to paid options. Make sure to look for "Shared" or "M0" during creation.

1.  **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up/log in.
2.  **Create a New Deployment**:
    *   Click **+ Create** or **Build a Database**.
    *   **CRITICAL STEP**: You will see options like "Serverless", "Dedicated", and "Shared".
    *   **Select "M0" (FREE)**: Look for the **M0** option (sometimes under a "Shared" tab or at the bottom/far right).
    *   **Provider & Region**: Select **AWS** and a region with the "Free Tier Available" label (e.g., N. Virginia us-east-1).
    *   **Name**: Give it a name like `rezero-cluster`.
    *   Click **Create Deployment**.
3.  **Create a Database User**:
    *   You will be prompted to set up a username and password.
    *   **Username**: `admin` (or your choice).
    *   **Password**: Click "Autogenerate Secure Password" and **COPY IT IMMEDIATELY**.
    *   Click **Create Database User**.
4.  **Allow Network Access**:
    *   Go to **Network Access** in the left sidebar.
    *   Click **Add IP Address**.
    *   Select **Allow Access from Anywhere** (`0.0.0.0/0`). (This is required for Render to connect).
    *   Click **Confirm**.
5.  **Get Connection String**:
    *   Go to **Database** in the left sidebar.
    *   Click **Connect**.
    *   Select **Drivers**.
    *   Copy the connection string (e.g., `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).
    *   **Replace `<password>`** with the password you generated in step 3.

---

## 2. Backend Deployment (Render)

**Cost**: Free (Web Service Free Tier)

1.  **Create an Account**: Go to [Render](https://render.com/) and sign up/log in.
2.  **New Web Service**:
    *   Click **New +** and select **Web Service**.
    *   Select **Build and deploy from a Git repository**.
    *   Connect your GitHub repository.
3.  **Configure Service**:
    *   **Name**: `rezero-server`
    *   **Region**: Choose your region.
    *   **Branch**: `main`.
    *   **Root Directory**: `server` (Important: This sets the build context).
    *   **Runtime**: `Docker`
    *   **Dockerfile Path**: `Dockerfile` (This refers to `server/Dockerfile` because we set Root Directory).
    *   **Instance Type**: Select **Free**.
4.  **Environment Variables**:
    *   Scroll down to **Environment Variables** and add the variables listed below.

### Render Environment Variables Reference

Use this table to configure your Render service:

| Variable | Value / Description | Required |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | **Yes** |
| `MONGODB_URI` | Your full connection string from Atlas (e.g. `mongodb+srv://...`) | **Yes** |
| `OPENAI_API_KEY` | Your OpenAI API Key (starts with `sk-...`) | **Yes** |
| `JWT_SECRET` | A long random string for security (e.g. `mysecretkey123!`) | **Yes** |
| `CLIENT_URL` | Your frontend URL (e.g. `https://rezero-client.vercel.app`). **No trailing slash**. | **Yes** (for CORS) |
| `PORT` | `10000` | **Yes** |
| `OPENAI_MODEL` | `gpt-4o-mini` (or your preferred model) | No (Default: gpt-4o-mini) |
| `JWT_EXPIRES_IN` | `24h` | No (Default: 24h) |

5.  **Deploy**: Click **Create Web Service**.
6.  **Copy Backend URL**: Once deployed (it may take a few minutes), copy the URL (e.g., `https://rezero-server.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

**Cost**: Free (Hobby Tier)

1.  **Create an Account**: Go to [Vercel](https://vercel.com/) and sign up.
2.  **Add New Project**:
    *   Click **Add New...** > **Project**.
    *   Import your GitHub repository.
3.  **Configure Project**:
    *   **Framework Preset**: Select **Vite**.
    *   **Root Directory**: Click `Edit` and select `client`.
4.  **Environment Variables**:
    *   Expand **Environment Variables** and add:

    | Key | Value |
    | :--- | :--- |
    | `VITE_API_BASE_URL` | Your Render Backend URL + `/api/v1` (e.g., `https://rezero-server.onrender.com/api/v1`) |
    | `VITE_APP_NAME` | `Re-Zero AI` |
    | `VITE_APP_VERSION` | `1.0.0` |

### Vercel Environment Variables Reference

Use this table to configure your Vercel project:

| Variable | Value / Description | Required |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Your **Render Backend URL** + `/api/v1` (e.g., `https://rezero-server.onrender.com/api/v1`) | **Yes** |
| `VITE_APP_NAME` | `Re-Zero AI` (or your custom name) | No |
| `VITE_APP_VERSION` | `1.0.0` | No |
| `VITE_NODE_ENV` | `production` | No (Vercel sets NODE_ENV automatically, but good to be explicit) |

5.  **Deploy**: Click **Deploy**.

---

## 4. Final Configuration

1.  **Update Backend with Frontend URL**:
    *   Go back to **Render** -> `rezero-server` -> **Environment**.
    *   Add/Update `CLIENT_URL` with your new Vercel URL (e.g., `https://rezero-client.vercel.app` - no trailing slash).
    *   Render will re-deploy automatically.

---

## Alternative: Self-Hosting (Docker on VPS)

If you prefer full control and want to avoid Cloud limits, you can host everything on any server with Docker (e.g., a $5/mo DigitalOcean Droplet, Hetzner, or a local server).

We have prepared the necessary configuration files for you:
- `docker-compose.prod.yml`: Orchestrates the database, backend, and frontend.
- `client/Dockerfile`: Builds the React app and serves it with Nginx.
- `server/Dockerfile`: Builds the Node.js backend.

### Steps for Self-Hosting

1.  **Get a Server**: Ubuntu 22.04 LTS recommended.
2.  **Install Docker & Compose**:
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    ```
3.  **Deploy**:
    Copy the project to your server (or git clone), then run:

    ```bash
    # Create a .env file with your secrets
    export OPENAI_API_KEY=your_key_here
    export JWT_SECRET=your_secret_here
    
    # Start the services in production mode
    docker compose -f docker-compose.prod.yml up -d
    ```

The application will be available at `http://your-server-ip`.
