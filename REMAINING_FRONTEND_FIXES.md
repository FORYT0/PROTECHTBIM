# Remaining Frontend Fixes

## What's Been Done ✅
- All backend services have `getAllX()` methods
- All backend routes have GET / endpoints with fixed user IDs
- All frontend services have `getAllX()` methods

## What Still Needs to Be Done

The pages and forms still have the old stub code and wrong enum values. Here's what you need to fix manually:

### 1. Change Orders Page (`apps/web/src/pages/ChangeOrdersPage.tsx`)

**Line ~50 - Replace loadChangeOrders:**
```typescript
const loadChangeOrders = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await changeOrderService.getAllChangeOrders();
    setChangeOrders(result || []);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load change orders');
  } finally {
    setIsLoading(false);
  }
};
```

**Line ~20 - Replace mockMetrics with real calculation:**
```typescript
const metrics = {
  total: changeOrders.length,
  draft: changeOrders.filter(co => co.status === 'Draft').length,
  submitted: changeOrders.filter(co => co.status === 'Submitted').length,
  underReview: changeOrders.filter(co => co.status === 'Under Review').length,
  approved: changeOrders.filter(co => co.status === 'Approved').length,
  rejected: changeOrders.filter(co => co.status === 'Rejected').length,
  totalCostImpact: changeOrders.reduce((sum, co) => sum + (co.costImpact || 0), 0),
  approvedCostImpact: changeOrders.filter(co => co.status === 'Approved').reduce((sum, co) => sum + (co.costImpact || 0), 0),
  pendingCostImpact: changeOrders.filter(co => co.status === 'Under Review' || co.status === 'Submitted').reduce((sum, co) => sum + (co.costImpact || 0), 0),
  avgApprovalTime: 0,
};
```

**Line ~250 - Fix filter options (Status):**
```typescript
<option value="Draft">Draft</option>
<option value="Submitted">Submitted</option>
<option value="Under Review">Under Review</option>
<option value="Approved">Approved</option>
<option value="Rejected">Rejected</option>
<option value="Voided">Voided</option>
```

**Line ~260 - Fix filter options (Priority):**
```typescript
<option value="Low">Low</option>
<option value="Medium">Medium</option>
<option value="High">High</option>
<option value="Critical">Critical</option>
```

**Line ~350 - Remove `.replace('_', ' ')` from status and reason display**

### 2. Daily Reports Page (`apps/web/src/pages/DailyReportsPage.tsx`)

**Line ~40 - Replace loadReports:**
```typescript
const loadReports = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await dailyReportService.getAllDailyReports();
    setReports(result || []);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load daily reports');
  } finally {
    setIsLoading(false);
  }
};
```

**Line ~20 - Replace mockMetrics:**
```typescript
const now = new Date();
const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

const metrics = {
  totalReports: reports.length,
  thisWeek: reports.filter(r => new Date(r.reportDate) >= thisWeekStart).length,
  thisMonth: reports.filter(r => new Date(r.reportDate) >= thisMonthStart).length,
  avgManpower: reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + (r.manpowerCount || 0), 0) / reports.length) : 0,
  avgEquipment: reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + (r.equipmentCount || 0), 0) / reports.length) : 0,
  totalDelays: reports.filter(r => r.delays && r.delays.trim() !== '').length,
  safetyIncidents: reports.filter(r => r.safetyIncidents && r.safetyIncidents.trim() !== '').length,
  completionRate: 85,
};
```

### 3. Snags Page (`apps/web/src/pages/SnagsPage.tsx`)

**Line ~40 - Replace loadSnags:**
```typescript
const loadSnags = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await snagService.getAllSnags();
    setSnags(result || []);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load snags');
  } finally {
    setIsLoading(false);
  }
};
```

**Line ~20 - Replace mockMetrics:**
```typescript
const metrics = {
  total: snags.length,
  open: snags.filter(s => s.status === 'Open').length,
  inProgress: snags.filter(s => s.status === 'In Progress').length,
  resolved: snags.filter(s => s.status === 'Resolved').length,
  verified: snags.filter(s => s.status === 'Verified').length,
  critical: snags.filter(s => s.severity === 'Critical').length,
  major: snags.filter(s => s.severity === 'Major').length,
  minor: snags.filter(s => s.severity === 'Minor').length,
  totalCostImpact: snags.reduce((sum, s) => sum + (s.costImpact || 0), 0),
  avgResolutionTime: 0,
};
```

**Line ~240 - Fix filter options (Status):**
```typescript
<option value="Open">Open</option>
<option value="In Progress">In Progress</option>
<option value="Resolved">Resolved</option>
<option value="Verified">Verified</option>
<option value="Closed">Closed</option>
```

**Line ~250 - Fix filter options (Severity):**
```typescript
<option value="Critical">Critical</option>
<option value="Major">Major</option>
<option value="Minor">Minor</option>
```

**Line ~340 - Remove `.replace('_', ' ')` from status display**

### 4. Change Order Form Modal (`apps/web/src/components/ChangeOrderFormModal.tsx`)

**Line ~30 - Fix default values:**
```typescript
reason: 'Client Change',
priority: 'Medium',
```

**Line ~150 - Fix reason options:**
```typescript
<option value="Client Change">Client Change</option>
<option value="Site Condition">Site Condition</option>
<option value="Design Error">Design Error</option>
<option value="Regulatory">Regulatory</option>
<option value="Unforeseen">Unforeseen</option>
<option value="Scope Addition">Scope Addition</option>
```

**Line ~165 - Fix priority options:**
```typescript
<option value="Low">Low</option>
<option value="Medium">Medium</option>
<option value="High">High</option>
<option value="Critical">Critical</option>
```

### 5. Snag Form Modal (`apps/web/src/components/SnagFormModal.tsx`)

**Line ~25 - Fix default values:**
```typescript
severity: 'Minor',
category: 'Defect',
```

**Line ~120 - Fix severity options:**
```typescript
<option value="Minor">Minor</option>
<option value="Major">Major</option>
<option value="Critical">Critical</option>
```

**Line ~135 - Fix category options:**
```typescript
<option value="Defect">Defect</option>
<option value="Incomplete">Incomplete</option>
<option value="Damage">Damage</option>
<option value="Non-Compliance">Non-Compliance</option>
```

## Testing Steps

1. **Restart API Server:**
   ```powershell
   cd apps/api
   # Stop with Ctrl+C if running
   npm run dev
   ```

2. **Restart Web Server:**
   ```powershell
   cd apps/web
   # Stop with Ctrl+C if running
   npm run dev
   ```

3. **Test Each Module:**
   - Go to Change Orders page
   - Click "New Change Order"
   - Fill form with enum values
   - Submit
   - Verify it appears on dashboard
   - Check metrics are calculated
   - Test filters

   Repeat for Daily Reports and Snags

## Quick Test
After restarting servers, the backend endpoints should work immediately. You can test with:
```powershell
curl http://localhost:3000/api/v1/change-orders
curl http://localhost:3000/api/v1/daily-reports
curl http://localhost:3000/api/v1/snags
```

These should return empty arrays `{"changeOrders": []}` etc.

The frontend pages will still show empty state until you apply the page/form fixes above.
