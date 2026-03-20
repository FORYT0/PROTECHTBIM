# Real-Time Architecture Setup Instructions

## Installation Steps

### 1. Install Frontend Dependencies

```bash
cd apps/web
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 2. Verify Backend Dependencies

Backend dependencies should already be installed. Verify:

```bash
cd apps/api
npm list socket.io
```

If not installed:
```bash
npm install socket.io
```

### 3. Update App.tsx to Enable Real-Time

Add the following to `apps/web/src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { wsClient } from './lib/websocket';
import { useRealtimeSync } from './hooks/useRealtimeSync';

function AppContent() {
  // Enable real-time sync
  useRealtimeSync();

  // Your existing app content
  return (
    <div>
      {/* Your routes and components */}
    </div>
  );
}

function App() {
  // Connect WebSocket on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      wsClient.connect(token);
    }

    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      {/* DevTools for debugging (remove in production) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
```

### 4. Update Project Pages to Join Rooms

In any project-specific page (e.g., `ProjectDetailPage.tsx`):

```typescript
import { useProjectRoom } from '../hooks/useRealtimeSync';

function ProjectDetailPage() {
  const { id } = useParams();
  
  // Join project room for real-time updates
  useProjectRoom(id);
  
  // Rest of your component
}
```

### 5. Migrate Existing Data Fetching to React Query

**Before (old way):**
```typescript
const [project, setProject] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadProject() {
    setLoading(true);
    try {
      const data = await projectService.getProject(id);
      setProject(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  loadProject();
}, [id]);
```

**After (React Query):**
```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';

const { data: project, isLoading, error } = useQuery({
  queryKey: queryKeys.project(id),
  queryFn: () => projectService.getProject(id),
  enabled: !!id, // Only run if id exists
});
```

### 6. Update Mutations to Invalidate Queries

**Before (old way):**
```typescript
const handleSave = async (data) => {
  await budgetService.createBudget(data);
  // Manual refetch
  await loadProject();
};
```

**After (React Query):**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateProjectFinancials } from '../lib/queryClient';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (data) => budgetService.createBudget(data),
  onSuccess: (result, variables) => {
    // Invalidate related queries - React Query will refetch automatically
    invalidateProjectFinancials(variables.projectId);
    
    // Or invalidate specific queries
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.projectBudget(variables.projectId) 
    });
  },
});

const handleSave = (data) => {
  mutation.mutate(data);
};
```

### 7. Test Real-Time Updates

1. Start the API server:
```bash
cd apps/api
npm run dev
```

2. Start the web app:
```bash
cd apps/web
npm run dev
```

3. Open two browser windows side-by-side
4. Log in to both
5. Navigate to the same project
6. Create a budget in one window
7. Watch it appear in the other window automatically!

### 8. Environment Variables

Make sure you have the correct WebSocket URL in `apps/web/.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

## Verification Checklist

- [ ] `@tanstack/react-query` installed in `apps/web`
- [ ] `socket.io` installed in `apps/api`
- [ ] `socket.io-client` installed in `apps/web` (already done)
- [ ] `App.tsx` updated with QueryClientProvider and WebSocket connection
- [ ] `useRealtimeSync()` hook called in App
- [ ] Project pages use `useProjectRoom()` hook
- [ ] Existing data fetching migrated to `useQuery`
- [ ] Mutations use `useMutation` with invalidation
- [ ] Environment variables configured
- [ ] Backend emits events after mutations (already done in BudgetService)

## Testing Real-Time Events

### Backend Console
You should see:
```
[Realtime] Emitted budget:created to project abc-123
[Realtime] Emitted financial_summary:updated to project abc-123
```

### Frontend Console
You should see:
```
[WebSocket] Connected: socket-id-123
[WebSocket] Joining project: abc-123
[Realtime] Budget created: { projectId: 'abc-123', ... }
```

### React Query DevTools
- Open DevTools (bottom-left icon)
- See all queries and their states
- Watch queries invalidate and refetch in real-time

## Common Issues

### WebSocket Not Connecting
- Check VITE_WS_URL is correct
- Verify token is in localStorage
- Check CORS settings in backend

### Queries Not Refetching
- Verify `useRealtimeSync()` is called in App
- Check query keys match between invalidation and query
- Look for errors in console

### Events Not Received
- Verify `useProjectRoom()` is called with correct projectId
- Check user is authenticated
- Verify backend is emitting events (check logs)

## Next Steps

1. **Migrate all data fetching to React Query**
   - Replace useState + useEffect patterns
   - Use centralized query keys
   - Add proper error handling

2. **Add optimistic updates**
   - Update UI immediately before server responds
   - Rollback on error
   - Better UX

3. **Add loading skeletons**
   - Use `isLoading` from useQuery
   - Show skeleton components
   - Professional feel

4. **Monitor performance**
   - Use React Query DevTools
   - Check network tab
   - Optimize stale times

5. **Add more real-time events**
   - Update CostEntryService to emit events
   - Update TimeEntryService to emit events
   - Update WorkPackageService to emit events

## Documentation

See `REALTIME_ARCHITECTURE.md` for complete architecture documentation.

---

**Ready to go! 🚀**

Your app now has enterprise-grade real-time capabilities with proper separation of concerns, centralized state management, and automatic UI updates.
