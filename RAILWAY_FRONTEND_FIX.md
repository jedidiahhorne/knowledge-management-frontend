# Fixing Frontend API Connection Issues

## Problem 1: Connection Refused to localhost:8000

The frontend is trying to connect to `localhost:8000` instead of your Railway backend URL.

## Problem 2: ERR_NAME_NOT_RESOLVED with railway.internal

The frontend is trying to use Railway's internal URL (`railway.internal`) which is not accessible from browsers.

## Problem 3: URL Duplication

The API URL is being duplicated, like:
```
https://frontend.up.railway.app/backend.up.railway.app/api/v1/auth/login/json
```

This happens when `VITE_API_BASE_URL` is missing the `https://` protocol.

## Problem 4: Mixed Content Error

Browser error: "Mixed Content: The page was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint 'http://...'"

This happens when `VITE_API_BASE_URL` uses `http://` instead of `https://` in production.

## Root Causes

1. **Vite embeds environment variables at build time**, not runtime. If `VITE_API_BASE_URL` isn't set during the Docker build, it defaults to `localhost:8000`.

2. **Railway provides internal URLs** (`railway.internal`) which are only accessible within Railway's network, not from browsers. You must use the **public URL**.

3. **Missing protocol** - If `VITE_API_BASE_URL` doesn't start with `https://`, axios treats it as a relative URL and prepends the frontend's origin.

4. **HTTP in production** - If `VITE_API_BASE_URL` uses `http://` but the frontend is served over HTTPS, browsers block the request due to mixed content security policy.

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
- **MUST start with `https://`** (or `http://` for local dev)
- Use the **PUBLIC URL** from Railway's Networking tab
- URL format: `https://service-name.up.railway.app/api/v1`
- **DO NOT** use `railway.internal` URLs - these don't work from browsers
- **DO NOT** use `localhost` - this won't work in production
- **DO NOT** omit the protocol - this causes URL duplication

### Step 2: Trigger a Rebuild

After setting the variable:

1. Go to your service → **"Deployments"** tab
2. Click **"Redeploy"** or **"Deploy"**
3. Railway will rebuild with the new environment variable

### Step 3: Verify

After redeployment:
1. Open browser console (F12)
2. Look for: `API Base URL: https://your-backend.up.railway.app/api/v1`
3. Try to login - it should now connect correctly

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
- **MUST include `https://` at the beginning**

## Common Mistakes

### ❌ Wrong: Missing Protocol
```
VITE_API_BASE_URL=knowledge-management-backend.up.railway.app/api/v1
```
**Result:** URL duplication - `https://frontend.up.railway.app/knowledge-management-backend.up.railway.app/api/v1`

### ❌ Wrong: Internal URL
```
VITE_API_BASE_URL=https://knowledge-management-backend.railway.internal/api/v1
```
**Result:** `ERR_NAME_NOT_RESOLVED` - internal URLs don't work from browsers

### ❌ Wrong: Localhost
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
**Result:** `ERR_CONNECTION_REFUSED` - localhost doesn't exist in production

### ❌ Wrong: HTTP in Production
```
VITE_API_BASE_URL=http://knowledge-management-backend.up.railway.app/api/v1
```
**Result:** Mixed Content Error - browsers block HTTP requests from HTTPS pages

### ✅ Correct: Public URL with Protocol
```
VITE_API_BASE_URL=https://knowledge-management-backend.up.railway.app/api/v1
```
**Result:** Works correctly!

## Quick Check

To verify the variable is being used:

1. Check Railway build logs
2. Look for the build output
3. Open browser console and look for: `API Base URL: ...`
4. The API URL should be embedded in the built JavaScript files

## Still Not Working?

If it still has issues:

1. **Clear browser cache** - old JavaScript might be cached
2. **Check build logs** - verify `VITE_API_BASE_URL` was available during build
3. **Hard refresh** - Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. **Check browser console** - look for the actual API URL being used
5. **Verify the URL format** - must be `https://domain.com/api/v1` (with protocol!)
