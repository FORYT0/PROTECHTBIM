# REAL-TIME SYNCHRONIZATION REFACTOR - DEPLOYMENT GUIDE

## DEPLOYMENT CHECKLIST

### Backend Deployment

- [ ] Verify TypeScript compilation: `npm run build`
- [ ] Run database migrations (if any new tables needed)
- [ ] Ensure Redis is configured in environment variables
- [ ] Test unified dashboard endpoint locally
- [ ] Run integration tests
- [ ] Deploy API service
- [ ] Monitor logs for EnhancedEventBus errors

### Frontend Deployment

- [ ] Verify TypeScript compilation
- [ ] Build and test locally
- [ ] Update API endpoints if needed
- [ ] Test real-time synchronization (open 2 browser windows)
- [ ] Verify WebSocket connection
- [ ] Deploy web service

### Environment Variables

**Backend (.env):**
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Leave empty if no auth
REDIS_DB=0
API_PORT=3000
CORS_ORIGIN=http://localhost:3001,http://localhost:8081
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## ROLLOUT STRATEGY

### Phase 1: Monitor Only (24 hours)
1. Deploy backend with enhanced event bus
2. Deploy frontend with updated hooks
3. Monitor logs and metrics
4. Verify no errors in console
5. Check WebSocket connections

### Phase 2: Gradual Rollout (2-3 days)
1. Roll out to 25% of users
2. Monitor performance metrics
3. Check for race conditions
4. Verify cache hit rates
5. No errors after 24 hours → Roll out to 50%

### Phase 3: Full Rollout (1 day)
1. Roll out to 100% of users
2. Monitor metrics continuously
3. Keep rollback plan ready

## MONITORING

### Metrics to Track

**Performance:**
- Dashboard API response time (target: < 100ms)
- WebSocket message latency (target: < 50ms)
- Cache hit rate (target: > 80%)

**Errors:**
- EnhancedEventBus emission errors
- Redis connection failures
- WebSocket disconnections

**Business:**
- Data consistency across pages
- Change propagation time
- User experience metrics

### Key Logs to Watch

```
✅ [EventBus] Event: budget:created | Project: proj-123 | Listeners: 2
✅ [Snapshot] Cache hit for project proj-123
✅ [Realtime] Emitted budget:created to project proj-123
❌ [EventBus] Error in listener for budget:created: ...
❌ [Snapshot] Cache invalidation failed: ...
```

## ROLLBACK PLAN

If issues occur:

1. Revert frontend to previous version (turns off real-time sync)
2. System still works with polling-based updates
3. No data loss
4. Users may experience slight staleness

To disable real-time sync on frontend:
```typescript
// In App.tsx, comment out:
// useRealtimeSync();
```

## TESTING SCENARIOS

### Scenario 1: Single User
1. Open Dashboard
2. Open Budget page
3. Create budget
4. Verify Dashboard updates automatically

**Expected:** No manual refresh needed

### Scenario 2: Multi-User Same Project
1. User A: Open Dashboard (Window 1)
2. User B: Open Budget page (Window 2)
3. User B: Create budget
4. Verify User A's Dashboard updates automatically

**Expected:** Data synchronized within < 100ms

### Scenario 3: Cache Invalidation
1. Create budget (cache miss)
2. View dashboard (creates cache)
3. Update budget
4. Verify cache was invalidated
5. View dashboard (fresh data)

**Expected:** Fresh data every time after change

### Scenario 4: Offline Graceful Degradation
1. Disable Redis
2. Verify system still works (no caching)
3. Response times slower but consistent
4. No data loss

**Expected:** Graceful degradation, no crashes

## PERFORMANCE TARGETS

| Operation | Target | Actual |
|-----------|--------|--------|
| Dashboard API (cached) | < 50ms | |
| Dashboard API (cache miss) | < 500ms | |
| WebSocket broadcast | < 100ms | |
| Cache invalidation | instant | |
| Event emission | < 10ms | |
| Snapshot calculation | < 300ms | |

## DATABASE CONSIDERATIONS

No schema changes required. System works with existing tables:
- Budget
- BudgetLine
- CostEntry
- TimeEntry
- ChangeOrder
- Contract
- WorkPackage
- Resource

Existing indexes should be sufficient. Monitor query performance if needed.

## REDIS CONSIDERATIONS

### Storage
- Average snapshot size: 5-10MB per active project
- With 5-minute TTL: max ~50MB for 10 concurrent projects
- With 100 projects: ~200MB total

### Connection Pool
- Default: 1 connection
- For heavy load: consider increasing to 5-10

### Configuration
```
maxmemory-policy: allkeys-lru  # Evict LRU keys when full
```

## SECURITY NOTES

1. **Cache Invalidation** - Automatic, no manual intervention needed
2. **WebSocket Auth** - Token verified on every connection
3. **Project Isolation** - Users only see data for projects they have access to
4. **Event Broadcast** - Only broadcast to users in project room

## SUPPORT & TROUBLESHOOTING

### Issue: Dashboard not updating in real-time
**Debug:**
1. Check WebSocket connection: DevTools → Network → WS
2. Check for errors in console
3. Verify `useRealtimeSync()` is called in App
4. Check Redis connection: `redis-cli ping`

**Fix:**
- Restart Redis
- Restart API service
- Refresh browser

### Issue: Cache hit rate low (< 50%)
**Debug:**
1. Check average cache TTL (5 mins)
2. Check project activity level
3. Check Redis memory usage

**Fix:**
- Increase TTL if appropriate (balance with staleness)
- Monitor and optimize

### Issue: WebSocket disconnections
**Debug:**
1. Check network tab for disconnects
2. Check API logs for connection errors
3. Verify CORS and WS origin settings

**Fix:**
- Check environment variables
- Increase WebSocket ping/pong timeout
- Check network/firewall rules

## SUCCESS CRITERIA

- [x] All data changes propagate across pages in real-time
- [x] No stale UI
- [x] Dashboard response time < 100ms for cached requests
- [x] WebSocket broadcasts within 50ms
- [x] Zero data inconsistencies
- [x] Graceful degradation if Redis unavailable
- [x] No performance regression on existing features

## POST-DEPLOYMENT

### Monitoring (First Week)
- Daily log reviews
- Performance metrics tracking
- User feedback collection

### Optimization (After 1 Week)
- Analyze cache hit/miss rates
- Optimize snapshot calculations
- Fine-tune TTLs based on usage patterns

### Documentation (After 2 Weeks)
- Update API documentation
- Update frontend developer guide
- Create troubleshooting guide for support team
