# Fixing HTTP vs HTTPS in Railway Builds

## Problem

Even though `VITE_API_BASE_URL` is set correctly in Railway, the frontend still makes HTTP requests instead of HTTPS, causing mixed content errors.

## Root Cause

Railway environment variables are available at **runtime**, but Vite needs them at **build time**. If Railway doesn't pass `VITE_API_BASE_URL` as a Docker build argument, Vite uses a default or cached value.

## Solution 1: Verify Environment Variable Format

1. Go to Railway → Frontend Service → **"Variables"** tab
2. Check `VITE_API_BASE_URL` value
3. **MUST** be: `https://knowledge-management-backend-production.up.railway.app/api/v1`
4. **NOT**: `http://knowledge-management-backend-production.up.railway.app/api/v1`

## Solution 2: Force Rebuild Without Cache

Railway might be using a cached build. Force a fresh build:

1. Go to Railway → Frontend Service → **"Settings"** tab
2. Scroll to **"Build"** section
3. Look for **"Clear Build Cache"** or similar option
4. Or trigger a redeploy:
   - Go to **"Deployments"** tab
   - Click **"Redeploy"**
   - Select **"Clear cache"** if available

## Solution 3: Verify Build Logs

Check if the environment variable is being used during build:

1. Go to Railway → Frontend Service → **"Deployments"** tab
2. Click on the latest deployment
3. Check the build logs
4. Look for lines containing `VITE_API_BASE_URL`
5. Verify it shows the correct HTTPS URL

## Solution 4: Check Browser Console

After redeployment, open your frontend in a browser:

1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for log messages starting with `[API]`
4. You should see:
   - `[API] Original VITE_API_BASE_URL: https://...`
   - `[API] Page protocol: https:`
   - `[API] Final API Base URL: https://...`

If you see `http://` in the logs, the build is using the wrong value.

## Solution 5: Railway Build Arguments

Railway should automatically pass environment variables as build arguments, but you can verify:

1. Go to Railway → Frontend Service → **"Variables"** tab
2. Ensure `VITE_API_BASE_URL` is set at the **service level** (not project level)
3. The variable should be available during the Docker build

## Solution 6: Manual Verification

To verify what value is actually in the build:

1. After deployment, open your frontend URL
2. Open Developer Tools → **Console**
3. Type: `import.meta.env.VITE_API_BASE_URL`
4. Check what value it shows

If it shows `http://`, the build used the wrong value.

## Quick Fix Checklist

- [ ] `VITE_API_BASE_URL` is set to `https://...` (not `http://`)
- [ ] Variable is set at service level in Railway
- [ ] Cleared build cache and redeployed
- [ ] Checked build logs for correct value
- [ ] Checked browser console for `[API]` logs
- [ ] Verified final URL is `https://`

## Why This Happens

1. **Vite embeds environment variables at build time** - not runtime
2. **Railway caches builds** - old builds might use old values
3. **Environment variables must be available during Docker build** - Railway should pass them, but sometimes they don't

## The Code Fix

The code now automatically converts `http://` to `https://` at runtime when the page is loaded over HTTPS. However, it's better to have the correct value at build time to avoid the conversion step.

## Still Not Working?

If it's still using HTTP after all these steps:

1. **Double-check the variable value** - Make sure it's `https://` not `http://`
2. **Check for typos** - Variable name must be exactly `VITE_API_BASE_URL`
3. **Try deleting and recreating the variable** - Sometimes Railway needs a fresh variable
4. **Contact Railway support** - They can check if build arguments are being passed correctly

