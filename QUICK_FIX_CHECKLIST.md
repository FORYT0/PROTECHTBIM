# Quick Fix Checklist for API Connection Issues

## ⚡ Run These Commands in Order

### 1. Test API Connection
```powershell
.\test-api-connection.ps1
```
**Expected:** All green checkmarks ✓

### 2. If API Test Fails - Restart API Server
```powershell
# In API terminal (or open new terminal)
cd apps/api
npm run dev
```
**Wait for:** "🚀 Server is running on http://localhost:8080"

### 3. Restart Vite Dev Server
```powershell
# Stop current Vite server (Ctrl+C)
# Then restart:
cd apps/web
npm run dev
```
**Wait for:** "Local: http://localhost:8081/"

### 4. Hard Refresh Browser
- Press: `Ctrl + Shift + R`
- Or: DevTools → Right-click refresh → "Empty Cache and Hard Reload"

### 5. Check Console for New Logs
Open browser DevTools Console, you should see:
```
🔧 API Configuration: {
  VITE_API_URL: "http://localhost:8080/api/v1",
  API_BASE_URL: "http://localhost:8080/api/v1",
  mode: "development"
}
```

### 6. Test Form Submission
1. Try to create a contract
2. Watch console for detailed logs
3. Check Network tab for request status

## 🔍 What to Look For

### Console Logs (Good)
```
🔧 API Configuration: {...}
=== BUTTON CLICKED ===
Form valid: true
🌐 API Request: {...}
✅ API Response: { status: 201, ok: true }
```

### Console Logs (Bad)
```
❌ API Request Failed: {
  error: "Failed to fetch",
  errorType: "Network Error"
}
```

### Network Tab (Good)
- Request to `http://localhost:8080/api/v1/contracts`
- Status: 200, 201, or 401
- Response has data

### Network Tab (Bad)
- Status: "(failed)" or "ERR_CONNECTION_REFUSED"
- Status: "(cancelled)"
- No response data

## 🚨 If Still Not Working

### Check These:
1. **API Server Running?**
   ```powershell
   Get-NetTCPConnection -LocalPort 8080 -State Listen
   ```

2. **PostgreSQL Running?**
   ```powershell
   docker ps | Select-String postgres
   ```

3. **Firewall Blocking?**
   - Temporarily disable Windows Firewall to test
   - Or add exception for port 8080

4. **Wrong Port?**
   - Check `apps/api/.env` → `API_PORT=8080`
   - Check `apps/web/.env` → `VITE_API_URL=http://localhost:8080/api/v1`

5. **Browser Cache?**
   - Clear all browser data for localhost
   - Try incognito/private window

## 📊 Test with Browser Tool
Open `test-api-browser.html` in browser:
1. Test /health endpoint
2. Test /api/v1 endpoint
3. Test GET /api/v1/contracts

All should work (contracts may return 401 if not logged in, but should NOT show connection error).

## ✅ Success Indicators
- ✓ PowerShell test script passes
- ✓ Browser test page shows green checkmarks
- ✓ Console shows API configuration log
- ✓ Console shows API request/response logs
- ✓ Network tab shows successful requests
- ✓ Toast notifications appear
- ✓ Forms close after submission
- ✓ Data refreshes in list

## 📝 Share These for Help
1. Output of `.\test-api-connection.ps1`
2. Screenshot of browser test page results
3. Console logs from form submission
4. Network tab screenshot of failed request
5. API server terminal output
