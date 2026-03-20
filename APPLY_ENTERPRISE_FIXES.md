# Apply Enterprise Fixes - Complete Implementation Guide

## Summary
This document contains all the code changes needed to fix Change Orders, Daily Reports, and Snags pages following the same pattern used for Contracts.

## Backend Changes

### 1. Add getAllX() Methods to Services

Add these methods to the respective service files:

**ChangeOrderService.ts** - Add after constructor:
```typescript
async getAllChangeOrders(): Promise<ChangeOrder[]> {
  return await this.changeOrderRepository.find({
    relations: ['project', 'contract', 'submitter'],
    order: { createdAt: 'DESC' },
  });
}
```

**DailyReportService.ts** - Add after constructor:
```typescript
async getAllDailyReports(): Promise<DailyReport[]> {
  return await this.dailyReportRepository.find({
    relations: ['project', 'creator'],
    order: { reportDate: 'DESC' },
  });
}
```

**SnagService.ts** - Add after constructor:
```typescript
async getAllSnags(): Promise<Snag[]> {
  return await this.snagRepository.find({
    relations: ['project', 'workPackage', 'creator', 'assignee'],
    order: { createdAt: 'DESC' },
  });
}
```

### 2. Add GET / Endpoints to Routes

**change-orders.routes.ts** - Add after imports, before POST route:
```typescript
// Get all change orders
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Fetching all change orders');
    const changeOrders = await changeOrderService.getAllChangeOrders();
    console.log('✅ Found change orders:', changeOrders.length);
    res.json({ changeOrders });
  } catch (error: any) {
    console.error('❌ Error fetching change orders:', error);
    res.status(500).json({ error: error.message });
  }
});
```

Also fix the user ID in POST route:
```typescript
const userId = (req as any).user?.userId || 'a0077b22-fc68-408c-b1ce-aab3d36855de';
```

**daily-reports.routes.ts** - Add after imports, before POST route:
```typescript
// Get all daily reports
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Fetching all daily reports');
    const reports = await dailyReportService.getAllDailyReports();
    console.log('✅ Found daily reports:', reports.length);
    res.json({ reports });
  } catch (error: any) {
    console.error('❌ Error fetching daily reports:', error);
    res.status(500).json({ error: error.message });
  }
});
```

Also fix the user ID in POST route:
```typescript
const userId = (req as any).user?.userId || 'a0077b22-fc68-408c-b1ce-aab3d36855de';
```

**snags.routes.ts** - Add after imports, before POST route:
```typescript
// Get all snags
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Fetching all snags');
    const snags = await snagService.getAllSnags();
    console.log('✅ Found snags:', snags.length);
    res.json({ snags });
  } catch (error: any) {
    console.error('❌ Error fetching snags:', error);
    res.status(500).json({ error: error.message });
  }
});
```

Also fix the user ID in POST route:
```typescript
const userId = (req as any).user?.userId || 'a0077b22-fc68-408c-b1ce-aab3d36855de';
```

## Frontend Service Changes

### Add getAllX() Methods

**changeOrderService.ts** - Add this method:
```typescript
async getAllChangeOrders(): Promise<ChangeOrder[]> {
  try {
    console.log('changeOrderService.getAllChangeOrders called');
    const response = await apiRequest('/change-orders');
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      throw new Error(errorData.error || 'Failed to fetch change orders');
    }
    
    const data = await response.json();
    console.log('getAllChangeOrders response:', data);
    return data.changeOrders || [];
  } catch (error) {
    console.error('Error fetching change orders:', error);
    throw error;
  }
}
```

**dailyReportService.ts** - Add this method:
```typescript
async getAllDailyReports(): Promise<DailyReport[]> {
  try {
    console.log('dailyReportService.getAllDailyReports called');
    const response = await apiRequest('/daily-reports');
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      throw new Error(errorData.error || 'Failed to fetch daily reports');
    }
    
    const data = await response.json();
    console.log('getAllDailyReports response:', data);
    return data.reports || [];
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    throw error;
  }
}
```

**snagService.ts** - Add this method:
```typescript
async getAllSnags(): Promise<Snag[]> {
  try {
    console.log('snagService.getAllSnags called');
    const response = await apiRequest('/snags');
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      throw new Error(errorData.error || 'Failed to fetch snags');
    }
    
    const data = await response.json();
    console.log('getAllSnags response:', data);
    return data.snags || [];
  } catch (error) {
    console.error('Error fetching snags:', error);
    throw error;
  }
}
```

## Frontend Page Changes

### ChangeOrdersPage.tsx

Replace `loadChangeOrders` function:
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

Replace `mockMetrics` calculation:
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
  avgApprovalTime: 0, // Calculate from actual data if needed
};
```

Update filter options (replace the select elements):
```typescript
<select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="...">
  <option value="all">All Status</option>
  <option value="Draft">Draft</option>
  <option value="Submitted">Submitted</option>
  <option value="Under Review">Under Review</option>
  <option value="Approved">Approved</option>
  <option value="Rejected">Rejected</option>
  <option value="Voided">Voided</option>
</select>

<select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="...">
  <option value="all">All Priority</option>
  <option value="Low">Low</option>
  <option value="Medium">Medium</option>
  <option value="High">High</option>
  <option value="Critical">Critical</option>
</select>
```

Remove `.replace('_', ' ')` from status and reason display.

### DailyReportsPage.tsx

Replace `loadReports` function:
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

Replace `mockMetrics` calculation:
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
  completionRate: 85, // Calculate based on work completed vs planned
};
```

### SnagsPage.tsx

Replace `loadSnags` function:
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

Replace `mockMetrics` calculation:
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
  avgResolutionTime: 0, // Calculate from actual data if needed
};
```

Update filter options:
```typescript
<select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="...">
  <option value="all">All Status</option>
  <option value="Open">Open</option>
  <option value="In Progress">In Progress</option>
  <option value="Resolved">Resolved</option>
  <option value="Verified">Verified</option>
  <option value="Closed">Closed</option>
</select>

<select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="...">
  <option value="all">All Severity</option>
  <option value="Critical">Critical</option>
  <option value="Major">Major</option>
  <option value="Minor">Minor</option>
</select>
```

Remove `.replace('_', ' ')` from status display.

## Frontend Form Changes

### ChangeOrderFormModal.tsx

Update reason select options:
```typescript
<select required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="...">
  <option value="Client Change">Client Change</option>
  <option value="Site Condition">Site Condition</option>
  <option value="Design Error">Design Error</option>
  <option value="Regulatory">Regulatory</option>
  <option value="Unforeseen">Unforeseen</option>
  <option value="Scope Addition">Scope Addition</option>
</select>
```

Update priority select options:
```typescript
<select required value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="...">
  <option value="Low">Low</option>
  <option value="Medium">Medium</option>
  <option value="High">High</option>
  <option value="Critical">Critical</option>
</select>
```

Update default values in useState:
```typescript
reason: 'Client Change',
priority: 'Medium',
```

### SnagFormModal.tsx

Update severity select options:
```typescript
<select required value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="...">
  <option value="Minor">Minor</option>
  <option value="Major">Major</option>
  <option value="Critical">Critical</option>
</select>
```

Update category select options:
```typescript
<select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="...">
  <option value="Defect">Defect</option>
  <option value="Incomplete">Incomplete</option>
  <option value="Damage">Damage</option>
  <option value="Non-Compliance">Non-Compliance</option>
</select>
```

Update default values in useState:
```typescript
severity: 'Minor',
category: 'Defect',
```

## Testing Steps

1. Restart API server: `cd apps/api && npm run dev`
2. Restart web server: `cd apps/web && npm run dev`
3. Test each module:
   - Create new items
   - Verify they appear on dashboard
   - Check metrics are calculated correctly
   - Test filters with enum values
   - Verify enum values display correctly

## Status
Ready to apply - follow the changes above systematically for each file.
