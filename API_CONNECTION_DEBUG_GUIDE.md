# API Connection Debugging Guide

## Current Issue
Forms submit correctly but API requests fail with `ERR_CONNECTION_REFUSED`.

## Step-by-Step Diagnostic Process

### Step 1: Verify API Server is Running
Run the PowerShell diagnostic script:
```powershell
.\test-api-connection.ps1
```

**Expected Output:**
- ✓ Port 8080 is listening
- ✓ Health endpoint responded
- ✓ API v1 endpoint responded
- ✓ CORS is configured

**If any test fails:**
1. Check if API server is actually running in a terminal
2. Look for errors in the API server terminal output
3. Restart the API server: `cd apps/api; npm run dev`

### Step 2: Test API from Browser
Open `test-api-browser.html` in your browser (double-click the file).

**Run these tests in order:**
1. Click "Test /health" - Should show green success
2. Click "Test /api/v1" - Should show API info
3. Click "Test GET /api/v1/contracts" - May show 401 (auth required) but should NOT show connection error

**If you see connection errors:**
- API server is not running or not accessible
- Firewall is blocking port 8080
- Another process is using port 8080 but not your API

### Step 3: Check Frontend Configuration
The frontend has been updated with detailed logging. Open browser DevTools Console and look for:

```
🔧 API Configuration: {
  VITE_API_URL: "http://localhost:8080/api/v1",
  API_BASE_URL: "http://localhost:8080/api/v1",
  mode: "development"
}
```

**If VITE_API_URL is undefined or wrong:**
1. Check `apps/web/.env` file exists and contains: `VITE_API_URL=http://localhost:8080/api/v1`
2. Restart Vite dev server: `cd apps/web; npm run dev`
3. Hard refresh browser: `Ctrl + Shift + R`

### Step 4: Test Form Submission with Logging
1. Open browser DevTools Console
2. Try to create a contract
3. Look for these log messages:

```
=== BUTTON CLICKED ===
Form valid: true
Form data before submission: {...}
Submitting contract data: {...}
Creating contract with data: {...}
contractService.createContract called with: {...}
🌐 API Request: {
  url: "http://localhost:8080/api/v1/contracts",
  method: "POST",
  hasToken: true,
  headers: {...}
}
```

**If logging stops before "API Request":**
- Issue is in the service layer
- Check `contractService.ts` for errors

**If you see "API Request" but then error:**
- Network issue or API not responding
- Check Network tab for exact error

### Step 5: Check Network Tab
1. Open DevTools → Network tab
2. Try to create a contract
3. Find the `/contracts` request
4. Check:
   - Status: Should be 200, 201, or 401 (NOT "failed" or "cancelled")
   - Headers: Check Request URL is correct
   - Response: Check what the server returned

**Common Issues:**
- Status "(failed)" = Connection refused, API not running
- Status "cancelled" = Request was aborted by browser/code
- Status 401 = Auth issue (expected if not logged in)
- Status 404 = Route not found on API
- Status 500 = API server error

### Step 6: Verify CORS Configuration
Check `apps/api/.env`:
```
CORS_ORIGIN=http://localhost:8081,http://localhost:3001,http://localhost:5173
```

The Vite dev server runs on port 8081, so this should be included (it is).

**If you see CORS errors in console:**
1. Restart API server
2. Make sure API .env has correct CORS_ORIGIN
3. Check API server logs for CORS errors

### Step 7: Check API Server Logs
When you submit a form, check the API server terminal for:
- Incoming request logs
- Any error messages
- Database connection errors
- Route not found errors

**If no logs appear when submitting:**
- Request is not reaching the API server
- Connection is being blocked before it gets there

## Quick Fixes

### Fix 1: Restart Everything
```powershell
# Stop all servers (Ctrl+C in each terminal)

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Start API server
cd apps/api
npm run dev

# Start Web server (in new terminal)
cd apps/web
npm run dev
```

### Fix 2: Clear Browser Cache
1. Open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or press: `Ctrl + Shift + R`

### Fix 3: Check Firewall
```powershell
# Check if Windows Firewall is blocking port 8080
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*8080*"}

# Temporarily disable firewall to test (not recommended for production)
# Or add an exception for port 8080
```

### Fix 4: Verify Port is Not Occupied by Another Process
```powershell
# Find what's using port 8080
Get-NetTCPConnection -LocalPort 8080 | Select-Object -Property LocalAddress, LocalPort, State, OwningProcess
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess
```

## Expected Behavior After Fix

1. Form submission shows "Saving..." button state
2. Console shows complete log chain from button click to API response
3. Network tab shows successful request (status 200/201)
4. Toast notification appears (success or error)
5. Form closes and data refreshes
6. New item appears in the list

## Files Modified

- `apps/web/src/utils/api.ts` - Added detailed logging
- `test-api-connection.ps1` - PowerShell diagnostic script
- `test-api-browser.html` - Browser-based API tester

## Next Steps

1. Run `.\test-api-connection.ps1` and share the output
2. Open `test-api-browser.html` and run all tests, share results
3. Try form submission and share complete console output
4. Share Network tab screenshot showing the failed request
