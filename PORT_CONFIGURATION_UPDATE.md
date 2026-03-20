# Port Configuration Update

## Issue
The API server couldn't start on port 3000 due to permission error:
```
Error: listen EACCES: permission denied 0.0.0.0:3000
```

## Solution
Changed the port configuration to avoid the permission issue.

## Changes Made

### 1. API Server Port Changed
**File:** `apps/api/.env`

**Before:**
```env
API_PORT=3000
WEB_PORT=3001
```

**After:**
```env
API_PORT=3001
WEB_PORT=3002
```

### 2. CORS Origin Updated
**File:** `apps/api/.env`

**Before:**
```env
CORS_ORIGIN=http://localhost:3001
```

**After:**
```env
CORS_ORIGIN=http://localhost:3002
```

### 3. Web App API URL Updated
**File:** `apps/web/.env`

**Before:**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

**After:**
```env
VITE_API_URL=http://localhost:3001/api/v1
```

### 4. Fallback URLs Updated

Updated hardcoded fallback URLs in:
- `apps/web/src/utils/api.ts`
- `apps/web/src/contexts/AuthContext.tsx`
- `apps/web/src/services/icalendarService.ts`

All changed from `localhost:3000` to `localhost:3001`

## New Port Configuration

| Service | Port | URL |
|---------|------|-----|
| API Server | 3001 | http://localhost:3001 |
| Web App | 3002 | http://localhost:3002 |
| BIM Processor | 3003 | http://localhost:3003 |

## Next Steps

### 1. Restart API Server
```bash
cd apps/api
npm run dev
```

Expected output:
```
✅ Database connection established successfully
📊 Connected to: protecht_bim@localhost:15432
✅ Redis client connected
✅ Redis client ready
🔗 Connected to Redis at localhost:6379
🚀 Server is running on http://localhost:3001
```

### 2. Restart Web App
```bash
cd apps/web
npm run dev
```

Expected output:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:3002/
➜  Network: use --host to expose
```

### 3. Access the Application
- Open your browser
- Go to: http://localhost:3002
- Login with your credentials
- Try creating a work package

## Why Port 3000 Failed

On Windows, port 3000 can have permission issues because:
1. It might be reserved by Windows for system services
2. Antivirus or firewall might block it
3. Another application might have claimed it
4. Windows Hyper-V might reserve it

Port 3001 typically doesn't have these issues.

## Verification

After restarting both servers, verify:

1. **API Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok",...}`

2. **API Version:**
   ```bash
   curl http://localhost:3001/api/v1
   ```
   Should return API information

3. **Web App:**
   Open http://localhost:3002 in browser
   Should load the login page

## Troubleshooting

### If API still won't start:
- Check if port 3001 is available: `netstat -ano | Select-String ":3001"`
- Try a different port (e.g., 3005) in `.env` files
- Run PowerShell as Administrator

### If Web App can't connect to API:
- Verify API is running on port 3001
- Check browser console for CORS errors
- Verify `.env` file changes were saved
- Restart the web dev server

### If you need to use port 3000:
Run PowerShell as Administrator and try again with original port configuration.

## Summary

✅ Port configuration updated to avoid permission issues
✅ API will run on port 3001
✅ Web app will run on port 3002
✅ All URLs updated consistently

Ready to start both servers!
