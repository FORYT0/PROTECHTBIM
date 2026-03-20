# Enterprise Integration Test Guide

## Prerequisites
- API server running on port 8080
- Web server running (Vite dev server)
- User authenticated with valid token

## Test Checklist

### 1. Navigation Test
- [ ] Open web application
- [ ] Verify "Contracts" link visible in navigation
- [ ] Verify "Changes" link visible in navigation
- [ ] Verify "Reports" link visible in navigation
- [ ] Verify "Snags" link visible in navigation
- [ ] Click each link and verify page loads
- [ ] Check mobile menu shows grouped sections (Commercial, Field)

### 2. Contracts Page Test
- [ ] Navigate to `/contracts`
- [ ] Verify page header shows "Contracts"
- [ ] Verify "New Contract" button visible
- [ ] Verify empty state displays correctly
- [ ] Verify empty state message and icon

### 3. Change Orders Page Test
- [ ] Navigate to `/change-orders`
- [ ] Verify page header shows "Change Orders"
- [ ] Verify status filter buttons visible
- [ ] Verify all filter options: All, Draft, Submitted, Under Review, Approved, Rejected
- [ ] Click each filter and verify UI updates
- [ ] Verify empty state displays correctly

### 4. Daily Reports Page Test
- [ ] Navigate to `/daily-reports`
- [ ] Verify page header shows "Daily Reports"
- [ ] Verify "New Report" button visible
- [ ] Verify empty state displays correctly

### 5. Snags Page Test
- [ ] Navigate to `/snags`
- [ ] Verify page header shows "Snag List"
- [ ] Verify status filter buttons visible
- [ ] Verify severity filter buttons visible
- [ ] Click filters and verify UI updates
- [ ] Verify empty state displays correctly

### 6. Dashboard Integration Test
- [ ] Navigate to a project detail page
- [ ] Scroll to KPI section
- [ ] Verify first row shows: Tasks, Budget, RFIs, Issues, Team, Completion
- [ ] Verify second row shows: Contract Value, Variations, Open Snags, Field Reports
- [ ] Click "Contract Value" card → should navigate to `/contracts`
- [ ] Click "Variations" card → should navigate to `/change-orders`
- [ ] Click "Open Snags" card → should navigate to `/snags`
- [ ] Click "Field Reports" card → should navigate to `/daily-reports`

### 7. API Endpoint Test

Test snapshot endpoint:
```bash
# Get auth token from browser localStorage
# Replace {PROJECT_ID} and {TOKEN}

curl -X GET "http://localhost:8080/api/v1/projects/{PROJECT_ID}/snapshot" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "snapshot": {
    "project_id": "...",
    "contract_summary": {
      "original_value": 0,
      "revised_value": 0,
      "total_variations": 0,
      "pending_variations": 0
    },
    "change_order_summary": {
      "total": 0,
      "approved": 0,
      "pending": 0,
      "rejected": 0,
      "total_cost_impact": 0,
      "approved_cost_impact": 0
    },
    "field_summary": {
      "daily_reports_count": 0,
      "last_report_date": null,
      "total_manpower": 0,
      "active_delays": 0
    },
    "snag_summary": {
      "total": 0,
      "open": 0,
      "in_progress": 0,
      "resolved": 0,
      "critical": 0,
      "total_cost_impact": 0
    }
  }
}
```

### 8. Design Consistency Test
For each page, verify:
- [ ] Background is pure black (#000000)
- [ ] Cards use #0A0A0A background
- [ ] Border radius is 10px (rounded-xl)
- [ ] Hover effects work (scale and color change)
- [ ] Icons are properly colored
- [ ] Typography is consistent
- [ ] Spacing follows 8px grid
- [ ] Mobile responsive layout works

### 9. Browser Console Test
- [ ] Open browser console
- [ ] Navigate through all enterprise pages
- [ ] Verify no JavaScript errors
- [ ] Verify no 404 errors for routes
- [ ] Verify no TypeScript errors

### 10. Performance Test
- [ ] Navigation between pages is instant
- [ ] No loading delays
- [ ] Hover effects are smooth
- [ ] Animations run at 60fps

## Known Limitations (Expected)

1. **Empty States**: All pages show empty states because no data exists yet
2. **Modal Forms**: Create/Edit modals not implemented yet (TODO comments in place)
3. **Detail Pages**: Individual record detail pages not created yet
4. **Real Data**: Snapshot endpoint returns mock data structure
5. **Filters**: Filter buttons work but have no data to filter

## Next Development Steps

After passing all tests above:

1. **Implement Modal Forms**
   - Contract creation form
   - Change order creation form
   - Daily report creation form
   - Snag creation form

2. **Implement Detail Pages**
   - Contract detail view
   - Change order detail view
   - Daily report detail view
   - Snag detail view

3. **Connect Real Data**
   - Implement snapshot aggregation in backend
   - Connect dashboard KPIs to real data
   - Add React Query for data fetching
   - Implement cache invalidation

4. **Add Advanced Features**
   - Payment certificates
   - Cost line breakdown
   - Photo uploads
   - Delay event tracking

## Success Criteria

✅ All navigation links work
✅ All pages load without errors
✅ Design is consistent across all pages
✅ Empty states display correctly
✅ Filters work (UI updates)
✅ Dashboard KPIs visible
✅ Click-through navigation works
✅ API endpoint responds correctly
✅ No console errors
✅ Mobile responsive

## Troubleshooting

### Issue: Page shows 404
**Solution**: Verify route is added in `apps/web/src/App.tsx`

### Issue: Navigation link not visible
**Solution**: Check `apps/web/src/components/Layout.tsx` for link definition

### Issue: API endpoint returns 404
**Solution**: Verify route is registered in `apps/api/src/main.ts`

### Issue: TypeScript errors
**Solution**: Run `npm run build` to check for compilation errors

### Issue: Styling looks wrong
**Solution**: Verify Tailwind classes are correct and dev server is running

## Test Results Template

```
Date: ___________
Tester: ___________

Navigation Test: ☐ Pass ☐ Fail
Contracts Page: ☐ Pass ☐ Fail
Change Orders Page: ☐ Pass ☐ Fail
Daily Reports Page: ☐ Pass ☐ Fail
Snags Page: ☐ Pass ☐ Fail
Dashboard Integration: ☐ Pass ☐ Fail
API Endpoint: ☐ Pass ☐ Fail
Design Consistency: ☐ Pass ☐ Fail
Console Errors: ☐ Pass ☐ Fail
Performance: ☐ Pass ☐ Fail

Notes:
_________________________________
_________________________________
_________________________________
```
