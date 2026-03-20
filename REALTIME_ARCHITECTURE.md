# Real-Time Architecture - Implementation Guide

## Overview

This document describes the enterprise-grade real-time architecture implemented in PROTECHT BIM. The system follows a **3-layer backend architecture** with **hybrid real-time updates** on the frontend.

## Architecture Layers

### 1️⃣ Database Layer (PostgreSQL)

Strict relational model with proper foreign keys:

```
projects
├── work_packages
├── budgets
│   └── budget_lines (→ cost_codes)
├── cost_entries (→ cost_codes, vendors, work_packages)
├── time_entries (→ users, work_packages)
├── cost_codes (hierarchical)
├── vendors
├── resource_rates
└── activity_logs
```

**Rules:**
- All tables properly linked with foreign keys
- No loose references
- Cascading deletes where appropriate
- Indexes on foreign keys for performance

### 2️⃣ Service Layer (Business Logic)

All business logic lives in services. **Never calculate financial logic in frontend.**

**Key Services:**

#### FinancialAnalyticsService
- `getProjectFinancialSummary()` - Single source of truth for all financial metrics
- `getCostSummary()` - Cost breakdown by type and status
- `getBudgetUtilization()` - Budget usage percentage
- `getForecastToCompletion()` - EAC calculation
- `getCostPerformanceIndex()` - CPI calculation

**Location:** `apps/api/src/services/FinancialAnalyticsService.ts`

#### RealtimeEventService
- Emits WebSocket events after database mutations
- Wraps socket manager with clean interface
- Automatically triggers financial summary updates

**Location:** `apps/api/src/services/RealtimeEventService.ts`

#### BudgetService (Enhanced)
- Creates/updates/deletes budgets
- Emits real-time events after mutations
- Logs activities for audit trail

**Location:** `apps/api/src/services/BudgetService.ts`

**Pattern for all services:**
```typescript
async createEntity(data, userId) {
  // 1. Validate
  // 2. Save to database
  // 3. Log activity
  // 4. Emit real-time event
  // 5. Return result
}
```

### 3️⃣ API Layer (REST)

Clean REST endpoints that delegate to services.

**Financial Analytics Endpoints:**
- `GET /api/v1/projects/:projectId/financial-summary`
- `GET /api/v1/projects/:projectId/cost-summary`
- `GET /api/v1/projects/:projectId/budget-utilization`
- `GET /api/v1/projects/:projectId/forecast`

**Location:** `apps/api/src/routes/financial-analytics.routes.ts`

## Real-Time Update Strategy

We use **OPTION C - Hybrid Approach** (Best Long-Term):

### Backend: WebSocket Events

**Socket Manager** (`apps/api/src/websocket/socket-manager.ts`):
- Handles WebSocket connections
- JWT authentication
- Project rooms (users join/leave)
- User rooms (personal notifications)

**Event Flow:**
```
User creates cost entry
    ↓
Service saves to database
    ↓
Service emits WebSocket event
    ↓
All connected clients in project room receive event
    ↓
Clients invalidate React Query cache
    ↓
React Query refetches fresh data
    ↓
UI updates automatically
```

### Frontend: React Query + WebSocket

**React Query** (`apps/web/src/lib/queryClient.ts`):
- Manages all server state
- Automatic caching and refetching
- Centralized query keys
- Invalidation helpers

**WebSocket Client** (`apps/web/src/lib/websocket.ts`):
- Connects to backend WebSocket server
- Joins project rooms
- Listens for real-time events

**Real-time Sync Hook** (`apps/web/src/hooks/useRealtimeSync.ts`):
- Listens to WebSocket events
- Invalidates React Query caches
- Triggers automatic refetch

**Usage in App:**
```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { wsClient } from './lib/websocket';
import { useRealtimeSync } from './hooks/useRealtimeSync';

function App() {
  // Connect WebSocket on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      wsClient.connect(token);
    }
  }, []);

  // Enable real-time sync
  useRealtimeSync();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

**Usage in Project Pages:**
```typescript
import { useProjectRoom } from '../hooks/useRealtimeSync';

function ProjectDetailPage() {
  const { id } = useParams();
  
  // Join project room for real-time updates
  useProjectRoom(id);
  
  // Use React Query for data
  const { data: financialSummary } = useQuery({
    queryKey: queryKeys.projectFinancialSummary(id),
    queryFn: () => fetchFinancialSummary(id),
  });
  
  return <div>{/* Display data */}</div>;
}
```

## State Management Rules

### ✅ DO:
- Use React Query for ALL server state (projects, costs, budgets, etc.)
- Use Zustand/Redux for UI state (modals, filters, sidebar open/close)
- Invalidate queries after mutations
- Let React Query handle caching and refetching
- Emit WebSocket events after database mutations

### ❌ DON'T:
- Use `useState` for server data
- Calculate financial metrics in frontend
- Duplicate data between backend and frontend
- Manually manage loading/error states (React Query handles this)
- Forget to emit events after mutations

## Data Flow Example

### Creating a Cost Entry

**1. User submits form:**
```typescript
const mutation = useMutation({
  mutationFn: (data) => createCostEntry(data),
  onSuccess: (result, variables) => {
    // Invalidate related queries
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.projectCostEntries(variables.projectId) 
    });
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.projectFinancialSummary(variables.projectId) 
    });
  },
});
```

**2. Backend processes:**
```typescript
// CostEntryService.ts
async createCostEntry(data, userId) {
  // Save to database
  const costEntry = await this.costEntryRepository.create(data);
  
  // Log activity
  await this.activityLogRepository.create({...});
  
  // Emit real-time event
  this.realtimeEventService.emitCostEntryEvent(
    RealtimeEventType.COST_ENTRY_CREATED,
    costEntry.projectId,
    costEntry.id,
    { costEntry }
  );
  
  // Also emit financial update
  this.realtimeEventService.emitFinancialUpdate(
    costEntry.projectId,
    { costEntryId: costEntry.id }
  );
  
  return costEntry;
}
```

**3. Other users receive update:**
```typescript
// useRealtimeSync.ts
wsClient.on(RealtimeEventType.COST_ENTRY_CREATED, (event) => {
  // Invalidate queries for affected project
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.projectCostEntries(event.projectId) 
  });
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.projectFinancialSummary(event.projectId) 
  });
});
```

**4. React Query refetches:**
- Automatically refetches invalidated queries
- Updates UI with fresh data
- No manual refresh needed

## Derived Metrics - Centralized

All financial calculations happen in `FinancialAnalyticsService`:

```typescript
// ✅ CORRECT - Backend calculates
const summary = await financialAnalyticsService.getProjectFinancialSummary(projectId);
// Returns: actualCost, budgetVariance, budgetHealth, etc.

// ❌ WRONG - Frontend calculates
const budgetVariance = totalBudget - actualCost; // DON'T DO THIS
```

**Why?**
- Single source of truth
- Consistent calculations across all clients
- No ghost numbers
- Easier to maintain and test

## Consistency Safeguards

### Database Transactions
```typescript
await AppDataSource.transaction(async (manager) => {
  // Save cost entry
  await manager.save(costEntry);
  
  // Update budget line
  await manager.update(BudgetLine, { id: budgetLineId }, {
    actualCost: () => `"actualCost" + ${costEntry.totalCost}`
  });
  
  // Post journal entry
  await manager.save(journalEntry);
  
  // If any step fails, entire transaction rolls back
});
```

### Atomic Operations
- Use database-level calculations for aggregations
- Avoid race conditions with proper locking
- Version locking for critical entities (budgets)

### Audit Logs
- Every mutation logged in `activity_logs` table
- Tracks who, what, when, and metadata
- Immutable audit trail

## Query Keys Convention

Centralized in `apps/web/src/lib/queryClient.ts`:

```typescript
export const queryKeys = {
  // Projects
  projects: ['projects'],
  project: (id: string) => ['projects', id],
  projectFinancialSummary: (id: string) => ['projects', id, 'financial-summary'],
  
  // Budgets
  budgets: ['budgets'],
  budget: (id: string) => ['budgets', id],
  projectBudget: (projectId: string) => ['projects', projectId, 'budget'],
  
  // Cost Entries
  costEntries: ['cost-entries'],
  projectCostEntries: (projectId: string) => ['projects', projectId, 'cost-entries'],
  
  // ... etc
};
```

**Benefits:**
- Type-safe query keys
- Easy to find all queries for an entity
- Consistent invalidation
- Autocomplete in IDE

## WebSocket Events

All events defined in both backend and frontend:

```typescript
export enum RealtimeEventType {
  // Budget events
  BUDGET_CREATED = 'budget:created',
  BUDGET_UPDATED = 'budget:updated',
  BUDGET_DELETED = 'budget:deleted',
  
  // Cost events
  COST_ENTRY_CREATED = 'cost_entry:created',
  COST_ENTRY_UPDATED = 'cost_entry:updated',
  COST_ENTRY_APPROVED = 'cost_entry:approved',
  
  // Financial summary (catch-all)
  FINANCIAL_SUMMARY_UPDATED = 'financial_summary:updated',
  
  // ... etc
}
```

## Performance Considerations

### Backend
- Indexes on all foreign keys
- Efficient queries with proper joins
- Pagination for large datasets
- Caching with Redis (already configured)

### Frontend
- React Query handles caching automatically
- Stale time: 30 seconds (configurable)
- Background refetching on window focus
- Optimistic updates for better UX

### WebSocket
- Project rooms reduce broadcast overhead
- Only send minimal data in events
- Clients refetch full data from API

## Testing Strategy

### Backend Services
```typescript
describe('FinancialAnalyticsService', () => {
  it('should calculate budget variance correctly', async () => {
    // Test financial calculations
  });
});
```

### Real-time Events
```typescript
describe('BudgetService', () => {
  it('should emit event after creating budget', async () => {
    const mockEventService = {
      emitBudgetEvent: jest.fn(),
    };
    
    const service = new BudgetService(undefined, undefined, mockEventService);
    await service.createBudget(data, userId);
    
    expect(mockEventService.emitBudgetEvent).toHaveBeenCalledWith(
      RealtimeEventType.BUDGET_CREATED,
      expect.any(String),
      expect.any(String),
      expect.any(Object)
    );
  });
});
```

### Frontend Queries
```typescript
describe('useProjectFinancialSummary', () => {
  it('should fetch and cache financial summary', async () => {
    // Test React Query hook
  });
});
```

## Migration Path

If you have existing code that doesn't follow this architecture:

1. **Move calculations to services**
   - Identify frontend calculations
   - Move to `FinancialAnalyticsService`
   - Create API endpoints
   - Update frontend to use API

2. **Add real-time events**
   - Import `RealtimeEventService` in existing services
   - Emit events after mutations
   - Test with multiple clients

3. **Migrate to React Query**
   - Replace `useState` + `useEffect` with `useQuery`
   - Replace manual fetch with mutations
   - Use centralized query keys
   - Add invalidation logic

4. **Enable WebSocket sync**
   - Add `useRealtimeSync()` to App
   - Add `useProjectRoom()` to project pages
   - Test real-time updates

## Monitoring & Debugging

### Backend Logs
```
[Realtime] Emitted budget:created to project abc-123
[Realtime] Emitted financial_summary:updated to project abc-123
```

### Frontend Logs
```
[WebSocket] Connected: socket-id-123
[WebSocket] Joining project: abc-123
[Realtime] Budget created: { projectId: 'abc-123', ... }
[React Query] Invalidating queries: ['projects', 'abc-123', 'financial-summary']
```

### React Query DevTools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Summary

✅ **3-Layer Backend:**
- Database: Strict relational model
- Services: All business logic
- API: Clean REST endpoints

✅ **Hybrid Real-Time:**
- WebSocket: Triggers updates
- React Query: Manages state
- Backend: Source of truth

✅ **Centralized Calculations:**
- `FinancialAnalyticsService` for all metrics
- No frontend calculations
- Consistent across all clients

✅ **Consistency Safeguards:**
- Database transactions
- Atomic operations
- Audit logs

✅ **Clean State Management:**
- React Query for server state
- Zustand/Redux for UI state
- Clear separation of concerns

This architecture scales to enterprise-level applications with multiple concurrent users, complex financial calculations, and real-time collaboration requirements.

---

**Files Created:**
- `apps/api/src/services/FinancialAnalyticsService.ts`
- `apps/api/src/services/RealtimeEventService.ts`
- `apps/api/src/routes/financial-analytics.routes.ts`
- `apps/web/src/lib/websocket.ts`
- `apps/web/src/lib/queryClient.ts`
- `apps/web/src/hooks/useRealtimeSync.ts`

**Files Modified:**
- `apps/api/src/services/BudgetService.ts` (added real-time events)
- `apps/api/src/main.ts` (registered financial analytics routes)
