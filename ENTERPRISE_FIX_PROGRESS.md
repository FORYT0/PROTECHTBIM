# Enterprise Pages Fix Progress

## ✅ Completed

### Backend Services
- ✅ ChangeOrderService.ts - Added `getAllChangeOrders()` method
- ✅ DailyReportService.ts - Added `getAllDailyReports()` method
- ✅ SnagService.ts - Added `getAllSnags()` method

### Backend Routes
- ✅ change-orders.routes.ts - Added GET / endpoint, fixed user ID
- ✅ daily-reports.routes.ts - Added GET / endpoint, fixed user ID
- ✅ snags.routes.ts - Added GET / endpoint, fixed user ID

### Frontend Services
- ✅ changeOrderService.ts - Added `getAllChangeOrders()` method
- ✅ dailyReportService.ts - Added `getAllDailyReports()` method
- ✅ snagService.ts - Added `getAllSnags()` method

## 🔄 In Progress

### Frontend Pages
- ⏳ ChangeOrdersPage.tsx - Need to update loadChangeOrders, metrics, and filters
- ⏳ DailyReportsPage.tsx - Need to update loadReports and metrics
- ⏳ SnagsPage.tsx - Need to update loadSnags, metrics, and filters

### Frontend Forms
- ⏳ ChangeOrderFormModal.tsx - Need to fix enum values
- ⏳ DailyReportFormModal.tsx - Already correct (no enums)
- ⏳ SnagFormModal.tsx - Need to fix enum values

## Next Steps
1. Update ChangeOrdersPage.tsx
2. Update DailyReportsPage.tsx
3. Update SnagsPage.tsx
4. Update ChangeOrderFormModal.tsx
5. Update SnagFormModal.tsx
6. Test all pages

## Testing Checklist
- [ ] Restart API server
- [ ] Restart web server
- [ ] Create change order
- [ ] Create daily report
- [ ] Create snag
- [ ] Verify all display on dashboards
- [ ] Test filters
- [ ] Verify metrics calculate correctly
