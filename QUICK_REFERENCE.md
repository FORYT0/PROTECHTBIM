# QUICK REFERENCE - Real-Time Synchronization

## For Backend Developers

### Adding Event Emission to a Service

```typescript
import { enhancedEventBus, SystemEventType, createSystemEvent } from './EnhancedEventBus';

// After database mutation
await enhancedEventBus.emit(
  createSystemEvent(
    SystemEventType.ENTITY_CREATED,  // or UPDATED, DELETED, APPROVED, etc.
    projectId,                         // Project ID
    userId,                            // User making change
    entityId,                          // ID of entity
    'EntityType',                      // Entity type name
    {
      // New values
      field1: newValue,
      field2: newValue,
    },
    {
      // Old values (optional)
      field1: oldValue,
    }
  )
);
```

### Example: Budget Service

```typescript
async createBudget(data: CreateBudgetDTO, userId: string): Promise<Budget> {
  // ... business logic ...
  const budget = await this.budgetRepository.create(budgetData);
  
  // ✅ Emit enhanced event
  await enhancedEventBus.emit(
    createSystemEvent(
      SystemEventType.BUDGET_CREATED,
      budget.projectId,
      userId,
      budget.id,
      'Budget',
      {
        budgetId: budget.id,
        totalBudget: budget.totalBudget,
        name: budget.name,
      }
    )
  );
  
  return budget;
}
```

## For Frontend Developers

### Using Unified Dashboard

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { useProjectRoom } from '../hooks/useRealtimeSync';

function DashboardPage({ projectId }: { projectId: string }) {
  // Join project room for real-time updates
  useProjectRoom(projectId);
  
  // Subscribe to unified snapshot
  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.projectDashboard(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    },
  });

  if (isLoading) return <Spinner />;

  const snapshot = response.data;
  
  return (
    <>
      {/* All metrics from single snapshot */}
      <FinancialWidget data={snapshot.financial} />
      <ResourcesWidget data={snapshot.resources} />
      <ScheduleWidget data={snapshot.schedule} />
      
      {/* Data automatically syncs via useRealtimeSync */}
    </>
  );
}
```

### Setup in App.tsx

```typescript
import { useRealtimeSync } from './hooks/useRealtimeSync';

function App() {
  // Enable real-time sync for entire app (call once)
  useRealtimeSync();
  
  return <Routes>...</Routes>;
}
```

## Event Types

```typescript
// Budget
SystemEventType.BUDGET_CREATED
SystemEventType.BUDGET_UPDATED
SystemEventType.BUDGET_DELETED
SystemEventType.BUDGET_LINE_UPDATED

// Cost Entry
SystemEventType.COST_ENTRY_CREATED
SystemEventType.COST_ENTRY_UPDATED
SystemEventType.COST_ENTRY_DELETED
SystemEventType.COST_ENTRY_APPROVED

// Time Entry
SystemEventType.TIME_ENTRY_CREATED
SystemEventType.TIME_ENTRY_UPDATED
SystemEventType.TIME_ENTRY_DELETED

// Change Order
SystemEventType.CHANGE_ORDER_CREATED
SystemEventType.CHANGE_ORDER_UPDATED
SystemEventType.CHANGE_ORDER_APPROVED
SystemEventType.CHANGE_ORDER_REJECTED

// Contract
SystemEventType.CONTRACT_UPDATED
SystemEventType.CONTRACT_VALUE_CHANGED

// Work Package
SystemEventType.WORK_PACKAGE_CREATED
SystemEventType.WORK_PACKAGE_UPDATED
SystemEventType.WORK_PACKAGE_COMPLETED
```

## API Endpoints

```
# Get full dashboard snapshot (cached)
GET /api/v1/projects/:projectId/dashboard

# Get specific sections
GET /api/v1/projects/:projectId/dashboard/financial
GET /api/v1/projects/:projectId/dashboard/resources
GET /api/v1/projects/:projectId/dashboard/schedule
GET /api/v1/projects/:projectId/dashboard/analytics

# Force refresh
POST /api/v1/projects/:projectId/dashboard/refresh
```

## Query Keys

```typescript
queryKeys.projectDashboard(projectId)           // Full snapshot
queryKeys.projectDashboardFinancial(projectId)  // Financial only
queryKeys.projectDashboardResources(projectId)  // Resources only
queryKeys.projectDashboardSchedule(projectId)   // Schedule only
queryKeys.projectDashboardAnalytics(projectId)  // Analytics only

// Invalidate all dashboard caches
invalidateProjectDashboard(projectId)
```

## Snapshot Structure

```json
{
  "projectId": "proj-123",
  
  "financial": {
    "contract": {
      "originalValue": 500000,
      "revisedValue": 520000,
      "variations": 20000,
      "status": "ACTIVE"
    },
    "budget": {
      "allocated": 400000,
      "spent": 320000,
      "committed": 30000,
      "remaining": 50000,
      "utilization": 80,
      "variance": 50000,
      "status": "AT_RISK"
    },
    "costs": {
      "labor": 200000,
      "material": 80000,
      "equipment": 30000,
      "subcontractor": 10000,
      "other": 0,
      "total": 320000
    },
    "changeOrders": {
      "pending": { "count": 2, "value": 15000 },
      "approved": { "count": 3, "value": 20000 },
      "rejected": { "count": 1, "value": 5000 }
    },
    "profitability": {
      "grossProfit": 200000,
      "profitMargin": 38.46,
      "projectedProfit": 215000,
      "health": "HEALTHY"
    }
  },
  
  "resources": {
    "allocated": 12,
    "totalHoursPlanned": 4800,
    "totalHoursUsed": 4200,
    "averageUtilization": 87.5,
    "overallocated": 2,
    "underutilized": 1
  },
  
  "schedule": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T00:00:00Z",
    "totalDays": 365,
    "elapsedDays": 120,
    "remainingDays": 245,
    "plannedProgress": 32.87,
    "actualProgress": 35,
    "variance": 2.13,
    "status": "ON_TRACK",
    "projectedCompletion": "2024-12-15T00:00:00Z"
  },
  
  "workPackages": {
    "total": 50,
    "notStarted": 15,
    "inProgress": 25,
    "completed": 10,
    "onHold": 0
  },
  
  "quality": {
    "totalChangeRequests": 8,
    "openChangeRequests": 2,
    "changeRequestRate": 2.4,
    "avgResolutionDays": 5
  },
  
  "metadata": {
    "lastUpdated": "2024-01-15T10:30:00Z",
    "cacheExpiresAt": "2024-01-15T10:35:00Z",
    "isCached": true
  }
}
```

## Debugging

### Check WebSocket Connection
```javascript
// In browser console
ws.readyState // 1 = OPEN, 3 = CLOSED
ws.onmessage // Should see events here
```

### Check Cache
```bash
# List all cache keys
redis-cli KEYS "snapshot:*"

# Get specific snapshot
redis-cli GET "snapshot:project:proj-123"

# Check memory usage
redis-cli INFO memory
```

### Check Events
```bash
# Monitor API logs
tail -f logs/api.log | grep EventBus

# Should see:
# ✅ [EventBus] Event: budget:created | Project: proj-123 | Listeners: 2
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Dashboard not updating | useRealtimeSync not called | Add to App.tsx |
| WebSocket 404 | Wrong WS URL | Check VITE_WS_URL env |
| Stale data | Cache not invalidated | Check Redis connection |
| Slow responses | Cache miss | Check Redis memory |
| Events not emitted | Service not updated | Add event emission code |

## Performance Optimization

**Cache Hit Rate:** Aim for > 80%
```
Response time with cache: < 50ms
Response time without cache: < 500ms
```

**Monitor:**
```bash
redis-cli INFO stats | grep hit_rate
```

**Tune TTL:**
- High activity project: 5 min (default)
- Low activity project: 15 min
- Static data: 1 hour

## Common Patterns

### Emit with Old Values (for comparison)
```typescript
await enhancedEventBus.emit(
  createSystemEvent(
    SystemEventType.BUDGET_UPDATED,
    projectId, userId, budgetId, 'Budget',
    { totalBudget: 500000 },      // New
    { totalBudget: 400000 }        // Old
  )
);
```

### Emit Approval Event
```typescript
await enhancedEventBus.emit(
  createSystemEvent(
    SystemEventType.CHANGE_ORDER_APPROVED,
    projectId, userId, coId, 'ChangeOrder',
    { 
      status: 'APPROVED',
      costImpact: 20000,
      approvedBy: userId,
      approvedAt: new Date()
    }
  )
);
```

## Next Steps

1. ✅ Setup complete
2. Deploy backend with event emission
3. Deploy frontend with useRealtimeSync
4. Monitor and optimize
5. Update docs for team

---

For detailed docs, see: `REALTIME_SYNCHRONIZATION_REFACTOR.md`
For deployment steps, see: `DEPLOYMENT_GUIDE.md`
