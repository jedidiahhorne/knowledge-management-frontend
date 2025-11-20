# Railway Deployment Guide - Frontend

This guide covers deploying the Knowledge Management Frontend to Railway.

## Prerequisites

- GitHub repository with your frontend code
- Railway account
- Backend API deployed and accessible

## Step 1: Push to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Knowledge Management Frontend"
   ```

2. Create repository on GitHub and push:
   ```bash
   gh repo create knowledge-management-frontend --public --source=. --remote=origin --push
   ```

## Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `knowledge-management-frontend`
5. Railway will detect the Dockerfile automatically

## Step 3: Configure Environment Variables

In your Railway service → **"Variables"** tab, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-backend.up.railway.app/api/v1` | Your backend API URL |

**Important:** 
- Replace `your-backend.up.railway.app` with your actual backend service URL
- Include `/api/v1` at the end
- Use `https://` protocol

## Step 4: Deploy

Railway will automatically:
1. Build the Docker image
2. Run the build process
3. Serve the app with nginx
4. Provide a public URL

## Step 5: Get Your URL

After deployment, Railway provides a URL like:
- `https://knowledge-management-frontend.up.railway.app`

Your frontend is now live!

## Environment Variables

### Required
- `VITE_API_BASE_URL` - Backend API base URL

### Example
```
VITE_API_BASE_URL=https://knowledge-management-backend.up.railway.app/api/v1
```

## How It Works

1. **Build Stage:**
   - Uses Node.js to install dependencies
   - Runs `npm run build` to create production build
   - Outputs to `dist/` directory

2. **Production Stage:**
   - Uses nginx to serve static files
   - Handles SPA routing (all routes serve index.html)
   - Serves optimized, compressed assets

## Troubleshooting

### Build Fails
- Check Railway build logs
- Verify all dependencies are in `package.json`
- Ensure Dockerfile is correct

### API Connection Errors
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend CORS settings allow your frontend domain
- Ensure backend is accessible

### 404 Errors on Routes
- This is normal for SPAs - nginx is configured to handle this
- All routes should serve `index.html`

### Environment Variables Not Working
- Vite requires `VITE_` prefix for environment variables
- Rebuild is required after changing env vars
- Check Railway logs for build output

## Updating Deployment

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Railway automatically detects the push and redeploys

## Custom Domain

1. Go to service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** or **"Custom Domain"**
3. Add your domain and configure DNS

## Cost Estimation

Railway pricing:
- **Free tier:** $5 credit/month
- **Hobby plan:** Pay-as-you-go (~$5-10/month for small apps)

The frontend should fit within the free tier for development/testing.

