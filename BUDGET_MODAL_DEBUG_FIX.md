# Budget Modal Debug Fix

## Issues Fixed

### 1. Cost Codes Not Loading
**Problem:** API endpoint was using relative URL `/api/v1/cost-codes` which doesn't work when frontend and backend are on different ports.

**Fix:** Updated to use `VITE_API_URL` environment variable:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const response = await fetch(`${API_URL}/cost-codes?level=2&is_active=true`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### 2. Add Line Button Not Working
**Problem:** No logging to debug the issue.

**Fix:** Added comprehensive logging:
```typescript
console.log('[BudgetModal] Add line clicked. Cost codes:', costCodes.length);
console.log('[BudgetModal] Available cost codes:', availableCostCodes.length);
console.log('[BudgetModal] Adding new line:', newLine);
```

### 3. Budget Save Not Working
**Problem:** Same relative URL issue + no error logging.

**Fix:** Updated both the modal and ProjectDetailPage to use full API URL with logging.

## Files Modified

1. `apps/web/src/components/BudgetSetupModal.tsx`
   - Fixed `loadCostCodes()` to use VITE_API_URL
   - Added logging throughout
   - Improved error messages
   - Fixed unique ID generation for budget lines

2. `apps/web/src/pages/ProjectDetailPage.tsx`
   - Fixed `handleSaveBudget()` to use VITE_API_URL
   - Added logging for debugging
   - Better error messages

## How to Test

### 1. Check Environment Variables

Make sure `apps/web/.env` has:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 2. Restart Development Servers

**IMPORTANT:** Vite needs to be restarted to pick up .env changes!

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web (RESTART THIS!)
cd apps/web
npm run dev
```

### 3. Open Browser Console

Open DevTools (F12) and go to Console tab. You should see:

```
[BudgetModal] Loading cost codes from: http://localhost:3000/api/v1/cost-codes
[BudgetModal] Token exists: true
[BudgetModal] Response status: 200
[BudgetModal] Cost codes loaded: 33
```

### 4. Test Budget Modal

1. Navigate to a project detail page
2. Click on the Budget card
3. Modal should open
4. Check console for cost code loading messages
5. Click "Add Line" button
6. Check console for add line messages
7. Fill in budget details
8. Click "Save Budget"
9. Check console for save messages

## Expected Console Output

### When Modal Opens:
```
[BudgetModal] Loading cost codes from: http://localhost:3000/api/v1/cost-codes
[BudgetModal] Token exists: true
[BudgetModal] Response status: 200
[BudgetModal] Cost codes loaded: 33
```

### When Adding Line:
```
[BudgetModal] Add line clicked. Cost codes: 33
[BudgetModal] Available cost codes: 33
[BudgetModal] Adding new line: {id: "temp-1234567890-0.123", costCodeId: "...", ...}
```

### When Saving Budget:
```
[BudgetModal] Save clicked
[BudgetModal] Saving budget: {projectId: "...", totalBudget: 2100000, ...}
[ProjectDetail] Saving budget to: http://localhost:3000/api/v1/projects/.../budget
[ProjectDetail] Response status: 201
[ProjectDetail] Budget saved: {budget: {...}}
[BudgetModal] Budget saved successfully
```

## Common Issues

### Issue 1: "Failed to load cost codes"

**Cause:** API server not running or wrong URL

**Solution:**
1. Check API server is running: `http://localhost:3000/health`
2. Check .env file has correct VITE_API_URL
3. Restart web dev server (Vite doesn't hot-reload .env changes)

### Issue 2: "All cost codes have been allocated"

**Cause:** No cost codes loaded or all already used

**Solution:**
1. Check console for cost code count
2. If 0, check API endpoint and authentication
3. If all used, remove some budget lines first

### Issue 3: "Failed to save budget: 401"

**Cause:** Authentication token missing or expired

**Solution:**
1. Check localStorage has 'token'
2. Log out and log back in
3. Check token is being sent in Authorization header

### Issue 4: "Failed to save budget: 400"

**Cause:** Validation error on backend

**Solution:**
1. Check console for detailed error message
2. Verify all budget lines have positive amounts
3. Verify total budget is positive
4. Check cost code IDs are valid

## Verification Checklist

- [ ] API server running on port 3000
- [ ] Web server running on port 3001 (or 8081)
- [ ] .env file has VITE_API_URL=http://localhost:3000/api/v1
- [ ] Web dev server restarted after .env changes
- [ ] Browser console open to see logs
- [ ] User is logged in (token in localStorage)
- [ ] Cost codes exist in database (43 seeded)
- [ ] Budget modal opens when clicking Budget card
- [ ] Cost codes load (check console)
- [ ] Add Line button works (check console)
- [ ] Budget saves successfully (check console)

## Database Check

If cost codes aren't loading, check the database:

```sql
-- Check if cost codes exist
SELECT COUNT(*) FROM cost_codes WHERE level = 2 AND "isActive" = true;

-- Should return 33 (Level-2 cost codes)

-- If 0, run migrations:
cd apps/api
npm run migration:run
```

## API Endpoint Test

Test the cost codes endpoint directly:

```bash
# Get your token from localStorage in browser console
# localStorage.getItem('token')

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/cost-codes?level=2&is_active=true
```

Should return:
```json
{
  "cost_codes": [
    {
      "id": "...",
      "code": "01.01",
      "name": "Site Preparation",
      "level": 2
    },
    ...
  ],
  "total": 33,
  "page": 1,
  "limit": 100
}
```

## Summary

The main issue was using relative URLs (`/api/v1/...`) instead of the full API URL from environment variables. This is fixed now with proper logging to help debug any future issues.

**Remember:** Always restart the Vite dev server after changing .env files!
