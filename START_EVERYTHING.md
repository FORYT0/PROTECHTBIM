# 🚀 Complete Startup Guide

## The Issue
Your API server couldn't start because PostgreSQL and Redis weren't running.

## Solution: Start Everything in Order

### Step 1: Start Docker Services
```powershell
.\start-services.ps1
```

Or manually:
```powershell
docker-compose up -d postgres redis
```

**Wait for:** "Services Started" message

**Verify services are running:**
```powershell
docker ps
```

You should see:
- `protecht-bim-postgres` (port 15432)
- `protecht-bim-redis` (port 6379)

### Step 2: Start API Server
```powershell
cd apps/api
npm run dev
```

**Wait for these messages:**
```
✅ Database connected successfully
✅ Redis client connected
✅ Redis client ready
🚀 Server is running on http://localhost:8080
📚 API documentation: http://localhost:8080/api/v1
🏥 Health check: http://localhost:8080/health
```

**If you see errors:**
- Database error: PostgreSQL not running → Run `docker-compose up -d postgres`
- Redis error: Redis not running → Run `docker-compose up -d redis`
- Port 8080 in use: Another process using port → Kill it or change API_PORT in .env

### Step 3: Start Web Server
Open a NEW terminal:
```powershell
cd apps/web
npm run dev
```

**Wait for:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8081/
```

### Step 4: Open Browser
1. Go to: http://localhost:8081
2. Press `Ctrl + Shift + R` to hard refresh
3. Open DevTools Console (F12)

**You should see:**
```
🔧 API Configuration: {
  VITE_API_URL: "http://localhost:8080/api/v1",
  API_BASE_URL: "http://localhost:8080/api/v1",
  mode: "development"
}
```

### Step 5: Test Form Submission
1. Navigate to Contracts page
2. Click "Create Contract"
3. Fill in the form
4. Click "Create Contract" button
5. Watch console for logs

**Expected console output:**
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
  hasToken: true
}
✅ API Response: {
  status: 201,
  statusText: "Created",
  ok: true
}
Contract created successfully: {...}
```

**Expected UI behavior:**
- Button shows "Saving..." briefly
- Green toast notification appears
- Form closes
- List refreshes with new contract

## Troubleshooting

### Docker Services Won't Start

**Check if Docker Desktop is running:**
```powershell
docker --version
docker ps
```

**If Docker is not running:**
1. Open Docker Desktop
2. Wait for it to fully start
3. Run `.\start-services.ps1` again

**View service logs:**
```powershell
docker logs protecht-bim-postgres
docker logs protecht-bim-redis
```

### API Server Won't Start

**Error: ECONNREFUSED (Database)**
```
PostgreSQL is not running
Solution: docker-compose up -d postgres
```

**Error: ECONNREFUSED (Redis)**
```
Redis is not running
Solution: docker-compose up -d redis
```

**Error: Port 8080 already in use**
```powershell
# Find what's using port 8080
Get-NetTCPConnection -LocalPort 8080 | Select-Object -Property OwningProcess
Get-Process -Id <OwningProcess>

# Kill the process or change API_PORT in apps/api/.env
```

### Web Server Issues

**Vite won't start:**
```powershell
# Clear cache and reinstall
cd apps/web
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

**Changes not showing:**
```
Hard refresh: Ctrl + Shift + R
Or clear browser cache completely
```

### Form Submission Still Fails

**Check console for API Configuration log:**
- If missing: Vite server needs restart
- If URL is wrong: Check apps/web/.env

**Check Network tab:**
- Request should go to: http://localhost:8080/api/v1/contracts
- Status should be: 201 (success) or 401 (auth required)
- NOT: "failed" or "ERR_CONNECTION_REFUSED"

**Check if logged in:**
```javascript
// In browser console
localStorage.getItem('auth_tokens')
```
If null, you need to log in first.

## Quick Commands Reference

### Start Everything
```powershell
# Terminal 1: Start Docker services
.\start-services.ps1

# Terminal 2: Start API
cd apps/api
npm run dev

# Terminal 3: Start Web
cd apps/web
npm run dev
```

### Stop Everything
```powershell
# Stop Docker services
docker-compose down

# Stop API and Web: Ctrl+C in their terminals
```

### Check Status
```powershell
# Check Docker services
docker ps

# Check ports
Get-NetTCPConnection -LocalPort 8080,15432,6379 | Select-Object LocalPort,State

# Test API
.\test-api-connection.ps1
```

### View Logs
```powershell
# Docker services
docker-compose logs -f postgres redis

# API: Check terminal where npm run dev is running
# Web: Check terminal where npm run dev is running
```

## What Was Fixed

1. **Added Redis password** to `apps/api/.env`:
   - Was: `REDIS_PASSWORD=`
   - Now: `REDIS_PASSWORD=redis123`

2. **Enhanced API logging** in `apps/web/src/utils/api.ts`:
   - Shows configuration on load
   - Logs every request/response
   - Detailed error messages

3. **Created startup script** `start-services.ps1`:
   - Checks Docker is running
   - Starts PostgreSQL and Redis
   - Verifies services are healthy

4. **Created diagnostic tools**:
   - `test-api-connection.ps1` - Test API from PowerShell
   - `test-api-browser.html` - Test API from browser

## Success Checklist

- [ ] Docker Desktop is running
- [ ] PostgreSQL container is running (port 15432)
- [ ] Redis container is running (port 6379)
- [ ] API server started successfully (port 8080)
- [ ] Web server started successfully (port 8081)
- [ ] Browser shows API configuration log
- [ ] Form submission shows detailed logs
- [ ] Toast notifications appear
- [ ] Data saves successfully

## Next Steps

Once everything is running:
1. Test all 4 enterprise modules (Contracts, Change Orders, Daily Reports, Snags)
2. Verify data persists after page refresh
3. Check that all CRUD operations work
4. Test with multiple projects

Your forms will work perfectly now! 🎉
