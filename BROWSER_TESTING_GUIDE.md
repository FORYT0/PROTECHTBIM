# Browser Testing Guide

## Current Status: Ready for Testing ✅

Both servers are running and all code changes are complete. Time to verify everything works in the browser.

---

## Quick Start

1. **Open your browser** and navigate to: http://localhost:8082

2. **Open Developer Tools** (Press F12)

3. **Test the upgraded pages** (these are the priority):
   - Time Tracking: http://localhost:8082/time-tracking
   - Cost Tracking: http://localhost:8082/cost-tracking

---

## What to Check

### 1. Console Tab (F12 → Console)

Look for:
- ❌ Red errors (JavaScript errors)
- ⚠️ Yellow warnings (React warnings)
- ✅ No failed API calls (or proper error handling)

### 2. Network Tab (F12 → Network)

Check:
- API calls going to `http://localhost:3000`
- Status codes (200 = success, 401 = not logged in, 404 = not found)
- Request headers include `Authorization: Bearer ...`

### 3. Time Tracking Page

Expected behavior:
- Shows loading spinner initially
- Displays time entries or "No time entries" message
- Metrics calculate from real data
- No console errors

### 4. Cost Tracking Page

Expected behavior:
- Shows loading spinner initially
- Displays cost entries or "No cost data" message
- Financial metrics calculate from real data
- No console errors

---

## Common Issues & Solutions

### Issue: 401 Unauthorized

**Cause**: Not logged in or token expired

**Solution**: 
1. Navigate to login page
2. Log in with your credentials
3. Return to the page

### Issue: Empty Data

**Cause**: No data in database yet

**This is OK!** The pages should show:
- Empty state messages
- Zero values for metrics
- No errors in console

### Issue: 404 Not Found

**Cause**: API endpoint doesn't exist

**Solution**: Check API server is running on port 3000

### Issue: Network Error

**Cause**: Can't connect to API

**Solution**: 
1. Verify API server is running
2. Check it's on port 3000
3. Try: http://localhost:3000/api/v1/health

---

## Test Checklist

### Priority Tests (Do These First)

- [ ] Open http://localhost:8082 - Home page loads
- [ ] Open http://localhost:8082/time-tracking - Page loads without errors
- [ ] Open http://localhost:8082/cost-tracking - Page loads without errors
- [ ] Check Console tab - No red errors
- [ ] Check Network tab - API calls are being made

### Secondary Tests (If Time Permits)

- [ ] Projects page loads
- [ ] Calendar page loads
- [ ] Resources page loads
- [ ] Contracts page loads
- [ ] Change Orders page loads
- [ ] Daily Reports page loads
- [ ] Snags page loads

---

## What Success Looks Like

### ✅ Perfect Success
- Pages load without errors
- Data displays correctly
- Metrics calculate accurately
- Smooth user experience

### ✅ Acceptable Success
- Pages load without errors
- Shows empty state (no data yet)
- No console errors
- API calls work (even if returning empty arrays)

### ❌ Needs Attention
- Red errors in console
- Pages crash or don't load
- API calls fail with 500 errors
- CORS errors

---

## Quick Commands

### Check if API is running:
```powershell
# Test API health endpoint
curl http://localhost:3000/api/v1/health
```

### Check if Web is running:
```powershell
# Should show the process
Get-Process node
```

### Restart Web Server (if needed):
```powershell
# Stop current process (Ctrl+C in terminal)
# Then restart:
cd apps/web
npm run dev
```

---

## Report Back

After testing, let me know:

1. **Did the pages load?** (Yes/No)
2. **Any console errors?** (Copy/paste if yes)
3. **Did API calls work?** (Check Network tab)
4. **Any issues?** (Describe what you see)

---

## Summary

You're testing to verify:
- ✅ Frontend compiles and runs
- ✅ Pages load without crashing
- ✅ API integration works
- ✅ Error handling is graceful
- ✅ User experience is smooth

**The application is ready - just open your browser and test!** 🚀
