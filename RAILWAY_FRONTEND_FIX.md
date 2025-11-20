# Fixing Frontend API Connection Issues

## Problem 1: Connection Refused to localhost:8000

The frontend is trying to connect to `localhost:8000` instead of your Railway backend URL.

## Problem 2: ERR_NAME_NOT_RESOLVED with railway.internal

The frontend is trying to use Railway's internal URL (`railway.internal`) which is not accessible from browsers.

## Root Causes

1. **Vite embeds environment variables at build time**, not runtime. If `VITE_API_BASE_URL` isn't set during the Docker build, it defaults to `localhost:8000`.

2. **Railway provides internal URLs** (`railway.internal`) which are only accessible within Railway's network, not from browsers. You must use the **public URL**.

## Solution

You need to set `VITE_API_BASE_URL` as a **build argument** in Railway.

### Step 1: Set Environment Variable in Railway

1. Go to your **frontend service** in Railway
2. Click **"Variables"** tab
3. Add or update:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://your-backend-service.up.railway.app/api/v1` |

**CRITICAL:** 
- Use the **PUBLIC URL** from Railway's Networking tab
- URL format: `https://service-name.up.railway.app/api/v1`
- **DO NOT** use `railway.internal` URLs - these don't work from browsers
- **DO NOT** use `localhost` - this won't work in production

### Step 2: Trigger a Rebuild

After setting the variable:

1. Go to your service → **"Deployments"** tab
2. Click **"Redeploy"** or **"Deploy"**
3. Railway will rebuild with the new environment variable

### Step 3: Verify

After redeployment:
1. Check the build logs - you should see the build process
2. Open your frontend URL
3. Try to login - it should now connect to your backend

## Alternative: Using Railway's Build Arguments

If the above doesn't work, Railway might need the variable set differently. Check:

1. **Service Settings** → **Build** section
2. Look for "Build Arguments" or "Build Environment Variables"
3. Ensure `VITE_API_BASE_URL` is available during build

## Finding Your Backend URL

1. Go to your Railway project
2. Click on your **backend service**
3. Go to **"Networking"** tab
4. Look for **"Public URL"** or **"Public Domain"**
5. Copy the public URL (e.g., `https://knowledge-management-backend.up.railway.app`)
6. Add `/api/v1` to the end for the full API base URL
7. **Example:** `https://knowledge-management-backend.up.railway.app/api/v1`

**Important:** 
- Use the URL that ends with `.up.railway.app`
- **NOT** the one with `.railway.internal`
- The public URL is what browsers can access

## Quick Check

To verify the variable is being used:

1. Check Railway build logs
2. Look for the build output
3. The API URL should be embedded in the built JavaScript files

## Still Not Working?

If it still connects to localhost:

1. **Clear browser cache** - old JavaScript might be cached
2. **Check build logs** - verify `VITE_API_BASE_URL` was available during build
3. **Hard refresh** - Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. **Check browser console** - look for the actual API URL being used

