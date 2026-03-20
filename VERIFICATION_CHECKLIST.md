# Verification Checklist - Time & Cost Features

## ✅ Changes Made

### Backend (API) - Port 3000
- [x] Created `apps/api/src/routes/project-analytics.routes.ts`
- [x] Registered analytics routes in `apps/api/src/main.ts`
- [x] API container rebuilt and running

### Frontend (Web) - Port 8081
- [x] Created `apps/web/src/pages/ProjectTimeCostPage.tsx`
- [x] Added route in `apps/web/src/App.tsx`
- [x] Added "Time & Cost" button in `apps/web/src/pages/ProjectDetailPage.tsx`
- [x] Fixed ActivityFeed unsubscribe error in `apps/web/src/components/ActivityFeed.tsx`
- [x] Added "View Wiki" button in `apps/web/src/pages/ProjectDetailPage.tsx`
- [x] Web dev server restarted

### Documentation
- [x] Created `USER_GUIDE_TIME_COST_TRACKING.md`
- [x] Created `TIME_COST_DATA_FLOW.md`
- [x] Created `TIME_COST_QUICK_START.md`
- [x] Updated `DEPLOYMENT_FIX_NOTES.md`

---

## 🔍 How to Verify Changes

### 1. Check Project Detail Page Buttons

**Steps:**
1. Open browser: `http://localhost:8081`
2. Login to the application
3. Navigate to **Projects** (sidebar)
4. Click on "Camp Solutions" project (or any project)
5. Look at the button row in the header

**Expected Result:**
You should see these buttons:
- ✅ Subscribe to Calendar
- ✅ View Gantt Chart
- ✅ View Calendar
- ✅ **View Wiki** (NEW)
- ✅ **Time & Cost** (NEW)
- ✅ View Boards
- ✅ Product Backlog
- ✅ Edit
- ✅ Delete

---

### 2. Test Time & Cost Analytics Page

**Steps:**
1. From project detail page, click **"Time & Cost"** button
2. You should be redirected to: `http://localhost:8081/projects/{project-id}/time-cost`

**Expected Result:**
You should see:
- ✅ Page title: "Time & Cost Analytics"
- ✅ "Back to Project" link
- ✅ Date range filter with calendar inputs
- ✅ Four summary cards:
  - Total Hours (with clock icon)
  - Total Cost (with dollar icon)
  - Work Packages (with package icon)
  - Avg Cost/WP (with trending icon)
- ✅ "Time by Work Package" section
- ✅ "Time by Team Member" section
- ✅ "Cost by Type" section
- ✅ "Cost by Work Package" section
- ✅ "Billable Time" section with progress bar
- ✅ "Billable Cost" section with progress bar

**Note:** If no data exists, you'll see "No time entries yet" or "No cost entries yet" messages.

---

### 3. Test Wiki Page

**Steps:**
1. From project detail page, click **"View Wiki"** button
2. You should be redirected to: `http://localhost:8081/projects/{project-id}/wiki`

**Expected Result:**
- ✅ Wiki page loads without errors
- ✅ Sidebar shows "Project Wiki" with "New Root Page" button
- ✅ Main area shows welcome message or existing wiki pages
- ✅ No console errors about "unsubscribe is not a function"

---

### 4. Verify Existing Time Tracking Page

**Steps:**
1. Click **"Time Tracking"** in the sidebar
2. Page should load at: `http://localhost:8081/time-tracking`

**Expected Result:**
- ✅ Page title: "Time Tracking"
- ✅ Two view buttons: "Daily View" and "Weekly View"
- ✅ Daily timesheet component loads
- ✅ "Add Time Entry" button visible
- ✅ Help cards at bottom explaining features

---

### 5. Verify Existing Cost Tracking Page

**Steps:**
1. Click **"Cost Tracking"** in the sidebar
2. Page should load at: `http://localhost:8081/cost-tracking`

**Expected Result:**
- ✅ Page title: "Cost Tracking"
- ✅ Cost report view loads
- ✅ Feature cards explaining cost types
- ✅ Cost types reference section at bottom

---

### 6. Test API Endpoints

**Test Time Analytics:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/projects/31d904b0-9591-441e-8f2a-cf6a8130bd7d/analytics/time"
```

**Expected Response:**
```json
{
  "project_id": "31d904b0-9591-441e-8f2a-cf6a8130bd7d",
  "total_hours": 0,
  "billable_hours": 0,
  "non_billable_hours": 0,
  "by_work_package": [],
  "by_user": [],
  "by_date": []
}
```

**Test Cost Analytics:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/projects/31d904b0-9591-441e-8f2a-cf6a8130bd7d/analytics/cost"
```

**Test Summary:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/projects/31d904b0-9591-441e-8f2a-cf6a8130bd7d/analytics/summary"
```

---

## 🐛 Troubleshooting

### Issue: "Time & Cost" button not visible

**Solution:**
1. Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Check browser console for errors (F12)
4. Verify web dev server is running: `http://localhost:8081`

### Issue: Page shows blank or loading forever

**Solution:**
1. Check browser console for errors (F12)
2. Verify API is running: `http://localhost:3000/health`
3. Check network tab to see if API calls are failing
4. Verify you're logged in (check for auth token)

### Issue: "Failed to load analytics"

**Solution:**
1. Verify project ID exists in database
2. Check API logs: `docker-compose logs api --tail 50`
3. Verify API analytics routes are registered
4. Test API endpoint directly with curl

### Issue: Console error "unsubscribe is not a function"

**Solution:**
- This should be fixed now
- If still occurring, hard refresh browser
- Check that `ActivityFeed.tsx` has the updated code

---

## 📊 Sample Data for Testing

To see the analytics in action, you need to create some sample data:

### Create Time Entry via API:
```bash
curl -X POST http://localhost:3000/api/v1/time_entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "work_package_id": "WORK_PACKAGE_ID",
    "hours": 8,
    "date": "2026-02-23",
    "comment": "Sample work",
    "billable": true
  }'
```

### Create Cost Entry via API:
```bash
curl -X POST http://localhost:3000/api/v1/cost_entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "work_package_id": "WORK_PACKAGE_ID",
    "type": "material",
    "amount": 5000,
    "currency": "USD",
    "date": "2026-02-23",
    "description": "Sample cost",
    "billable": true
  }'
```

---

## ✅ Final Verification Steps

1. [ ] Open `http://localhost:8081` in browser
2. [ ] Login to application
3. [ ] Navigate to Projects → Camp Solutions
4. [ ] Verify "Time & Cost" button is visible
5. [ ] Click "Time & Cost" button
6. [ ] Verify analytics page loads
7. [ ] Verify "View Wiki" button is visible
8. [ ] Click "View Wiki" button
9. [ ] Verify wiki page loads without errors
10. [ ] Check browser console (F12) - should have no errors
11. [ ] Navigate to Time Tracking page (sidebar)
12. [ ] Verify time tracking page loads
13. [ ] Navigate to Cost Tracking page (sidebar)
14. [ ] Verify cost tracking page loads

---

## 🎉 Success Criteria

All features are working if:
- ✅ No console errors
- ✅ All buttons visible on project detail page
- ✅ Time & Cost analytics page loads and displays data
- ✅ Wiki page loads without errors
- ✅ Time Tracking page accessible
- ✅ Cost Tracking page accessible
- ✅ API endpoints respond correctly

---

**Last Updated**: February 23, 2026
**Web Server**: http://localhost:8081
**API Server**: http://localhost:3000
