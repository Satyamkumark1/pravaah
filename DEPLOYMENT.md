# Pravaah Deployment Guide

This guide explains how to deploy the Pravaah project using Vercel (frontend) and Railway (backend).

## Architecture

- **Frontend**: React/Vite application deployed on Vercel
- **Backend**: FastAPI application deployed on Railway
- **Communication**: REST API + WebSocket connections

## Prerequisites

- GitHub account with project repository
- Vercel account ([vercel.com](https://vercel.com))
- Railway account ([railway.app](https://railway.app))
- Railway CLI (optional, for advanced setup)

## Step 1: Deploy Backend (Railway)

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your Pravaah repository
4. Configure the project settings:
   - **Root directory**: `pravaah/engine`
   - **Build command**: (leave empty, Railway auto-detects)
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 1.2 Configure Environment Variables

In Railway project settings, add these environment variables:

```
PORT=8000
CORS_ORIGINS=https://your-vercel-app-url.vercel.app
```

Note: Replace `your-vercel-app-url.vercel.app` with your actual Vercel domain after frontend deployment.

### 1.3 Deploy

1. Click "Deploy" to start the deployment
2. Railway will automatically detect the Python project and install dependencies
3. Wait for deployment to complete
4. Copy your Railway backend URL (e.g., `https://your-app.railway.app`)

### 1.4 Verify Backend

Test your backend health endpoint:
```bash
curl https://your-app.railway.app/health
```

## Step 2: Deploy Frontend (Vercel)

### 2.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New Project" → "Import Git Repository"
3. Select your Pravaah repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `pravaah/dashboard`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.2 Configure Environment Variables

In Vercel project settings, add these environment variables:

```
VITE_API_URL=https://your-railway-backend-url.railway.app
VITE_WS_URL=wss://your-railway-backend-url.railway.app
```

Replace with your actual Railway backend URL from Step 1.4.

### 2.3 Deploy

1. Click "Deploy" to start the deployment
2. Vercel will build and deploy your React application
3. Wait for deployment to complete
4. Copy your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

### 2.4 Update Railway CORS

Go back to your Railway project and update the `CORS_ORIGINS` environment variable:

```
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

Redeploy the Railway backend to apply the changes.

## Step 3: Update Frontend Configuration

The `vercel.json` file in `pravaah/dashboard/` handles API proxying. Update the Railway backend URL:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-railway-backend-url.railway.app/api/:path*"
    },
    {
      "source": "/ws/:path*",
      "destination": "https://your-railway-backend-url.railway.app/ws/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Replace `your-railway-backend-url.railway.app` with your actual Railway URL.

## Local Development Setup

For local development, create environment files:

### Backend (pravaah/engine/.env)
```
PORT=8000
CORS_ORIGINS=http://localhost:5173
```

### Frontend (pravaah/dashboard/.env.local)
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

Then run:
```bash
# Terminal 1 - Backend
cd pravaah/engine
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd pravaah/dashboard
npm run dev
```

## Troubleshooting

### CORS Errors
- Ensure Railway `CORS_ORIGINS` includes your Vercel domain
- Check that the backend is properly configured with the CORSMiddleware
- Verify environment variables are set correctly in both platforms

### WebSocket Connection Issues
- Ensure WebSocket URL uses `wss://` for production (not `ws://`)
- Check that Railway supports WebSocket connections (included in standard plan)
- Verify the `/ws/live` endpoint is accessible

### Build Failures
- Railway: Check Python version compatibility (requires Python 3.8+)
- Vercel: Ensure Node.js version is compatible (check package.json engines)
- Review build logs for specific error messages

### Environment Variables Not Loading
- Railway: Variables are automatically loaded, no need for .env files
- Vercel: Variables must be prefixed with `VITE_` to be accessible in frontend code
- Local: Ensure .env files are in the correct directories

## Monitoring

### Railway
- View logs in Railway dashboard
- Monitor resource usage (CPU, memory)
- Set up alerts for deployment failures

### Vercel
- View deployment logs in Vercel dashboard
- Monitor analytics and performance
- Set up custom domains if needed

## Cost Considerations

- **Railway**: Free tier available ($5/month after trial)
- **Vercel**: Free tier for hobby projects
- Both platforms scale automatically based on usage

## Security Notes

- Never commit `.env` files to version control
- Use strong, random values for any secrets
- Enable HTTPS (both platforms provide this by default)
- Consider adding authentication for production use
- Review CORS settings and restrict origins in production

## Additional Configuration Files

The project includes deployment configuration files:

- `pravaah/dashboard/vercel.json` - Vercel deployment settings
- `pravaah/engine/railway.json` - Railway deployment settings
- `pravaah/engine/Procfile` - Railway process configuration
- `pravaah/dashboard/.env.example` - Frontend environment template
- `pravaah/engine/.env.example` - Backend environment template

## Support

For platform-specific issues:
- Railway: [railway.app/docs](https://railway.app/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)

For application issues, check the main README.md and project documentation.