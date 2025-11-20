# Debugging 405 Method Not Allowed Error

## Common Causes

1. **CORS Issue** - Backend not allowing requests from frontend domain
2. **Wrong URL** - Missing API prefix or incorrect path
3. **Router not registered** - Auth router not included in main app

## Step 1: Verify Backend CORS Configuration

In your **backend service** on Railway → **"Variables"** tab, check:

| Variable | Should Include |
|----------|----------------|
| `CORS_ORIGINS` | Your frontend Railway URL |

**Example:**
```
CORS_ORIGINS=https://knowledge-management-frontend.up.railway.app,https://your-frontend.up.railway.app
```

**Important:**
- Include `https://` protocol
- No trailing slash
- Comma-separated if multiple origins
- Must match your frontend's exact URL

## Step 2: Verify API URL in Frontend

Check that your frontend is using the correct API URL:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `API Base URL: https://...`
4. Verify it's the **public** backend URL (not `railway.internal`)

## Step 3: Check Network Request

1. Open browser DevTools → Network tab
2. Try to login
3. Look at the failed request:
   - **URL:** Should be `https://backend.up.railway.app/api/v1/auth/login/json`
   - **Method:** Should be `POST`
   - **Status:** 405
   - **Request Headers:** Check `Origin` header matches your frontend URL

## Step 4: Test Backend Directly

Test if the backend endpoint works:

```bash
curl -X POST "https://your-backend.up.railway.app/api/v1/auth/login/json" \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

If this works, the issue is CORS. If it doesn't, the endpoint might not be registered.

## Step 5: Check Backend Logs

In Railway → Backend service → "Deployments" → Latest deployment → View logs

Look for:
- CORS errors
- Route registration messages
- Any errors during startup

## Quick Fix: Update CORS_ORIGINS

1. Get your frontend URL from Railway (frontend service → Networking tab)
2. Go to backend service → Variables tab
3. Update `CORS_ORIGINS` to include your frontend URL:
   ```
   https://your-frontend.up.railway.app
   ```
4. Redeploy backend service

## Verify Router Registration

The auth router should be included in `app/api/router.py`. Check that it includes:
```python
from app.api import auth
router.include_router(auth.router)
```

