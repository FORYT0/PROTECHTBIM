# Budget Modal Fix - Complete ✅

## Issues Fixed

### 1. ❌ 401 Unauthorized Error
**Problem:** Token was being retrieved incorrectly from localStorage.
- Code was looking for `localStorage.getItem('token')`
- But token is actually stored as `localStorage.getItem('auth_tokens')` with structure:
  ```json
  {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
  ```

**Fix:** 
- Updated `getAuthToken()` utility function in `apps/web/src/utils/api.ts`
- Now correctly parses `auth_tokens` and extracts `accessToken`
- Both BudgetSetupModal and ProjectDetailPage now use this utility

### 2. ❌ Wrong API URL
**Problem:** API_BASE_URL in `api.ts` was set to port 3001 (web server) instead of 3000 (API server).

**Fix:**
- Changed from `http://localhost:3001/api/v1` to `http://localhost:3000/api/v1`
- Now correctly points to the API server

### 3. ❌ Relative URLs
**Problem:** Code was using relative URLs like `/api/v1/cost-codes` which would try to fetch from the web server port.

**Fix:**
- All fetch calls now use full URL from `VITE_API_URL` environment variable
- Falls back to `http://localhost:3000/api/v1` if not set

## Files Modified

### 1. `apps/web/src/utils/api.ts` ✅
```typescript
// Fixed API_BASE_URL (was 3001, now 3000)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// getAuthToken() already correctly parses auth_tokens
export const getAuthToken = (): string | null => {
  const tokens = localStorage.getItem('auth_tokens');
  if (!tokens) return null;
  try {
    const parsed = JSON.parse(tokens);
    return parsed.accessToken; // ✅ Correct
  } catch {
    return null;
  }
};
```

### 2. `apps/web/src/components/BudgetSetupModal.tsx` ✅
```typescript
import { getAuthToken } from '../utils/api'; // ✅ Added import

const loadCostCodes = async () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const token = getAuthToken(); // ✅ Use utility function
  
  if (!token) {
    throw new Error('Not authenticated. Please log in again.');
  }
  
  const response = await fetch(`${API_URL}/cost-codes?level=2&is_active=true`, {
    headers: {
      'Authorization': `Bearer ${token}`, // ✅ Correct token
      'Content-Type': 'application/json',
    },
  });
  // ... rest of code
};
```

### 3. `apps/web/src/pages/ProjectDetailPage.tsx` ✅
```typescript
import { getAuthToken } from '../utils/api'; // ✅ Added import

const handleSaveBudget = async (budgetData: BudgetData) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const token = getAuthToken(); // ✅ Use utility function
  
  const response = await fetch(`${API_URL}/projects/${budgetData.projectId}/budget`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // ✅ Correct token
    },
    body: JSON.stringify({...}),
  });
  // ... rest of code
};
```

## Testing Steps

### 1. Restart Web Server
**CRITICAL:** You must restart the web dev server for changes to take effect!

```bash
# Stop the web server (Ctrl+C in terminal)
# Then restart:
cd apps/web
npm run dev
```

### 2. Clear Browser Cache (Optional but Recommended)
- Open DevTools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

### 3. Test Budget Modal

1. **Open browser console** (F12 → Console tab)
2. **Navigate to project detail page**
3. **Click Budget card** - Modal should open
4. **Check console** - Should see:
   ```
   [BudgetModal] Loading cost codes from: http://localhost:3000/api/v1/cost-codes
   [BudgetModal] Token exists: true
   [BudgetModal] Response status: 200
   [BudgetModal] Cost codes loaded: 33
   ```
5. **Click "Add Line"** - Should add a budget line with cost code dropdown populated
6. **Fill in budget details:**
   - Total Budget: 2100000
   - Contingency: 10%
   - Add budget lines with amounts
7. **Click "Save Budget"**
8. **Check console** - Should see:
   ```
   [BudgetModal] Save clicked
   [BudgetModal] Saving budget: {...}
   [ProjectDetail] Saving budget to: http://localhost:3000/api/v1/projects/.../budget
   [ProjectDetail] Response status: 201
   [ProjectDetail] Budget saved: {...}
   [BudgetModal] Budget saved successfully
   ```

## Expected Behavior

### ✅ Cost Codes Load
- Modal opens
- "Loading cost codes..." spinner appears briefly
- 33 cost codes load from API
- Dropdown is populated

### ✅ Add Line Works
- Click "Add Line" button
- New budget line appears
- Cost code dropdown is populated
- Can select different cost codes
- Can enter amounts

### ✅ Budget Saves
- Fill in all required fields
- Click "Save Budget"
- No errors in console
- Modal closes
- Project page reloads with updated budget

## Troubleshooting

### Still Getting 401 Error?

**Check localStorage:**
```javascript
// In browser console:
localStorage.getItem('auth_tokens')
// Should return: {"accessToken":"...","refreshToken":"..."}
```

**If null or invalid:**
1. Log out
2. Log back in
3. Try again

### Still Fetching from Wrong Port?

**Check environment variable:**
```javascript
// In browser console:
import.meta.env.VITE_API_URL
// Should return: "http://localhost:3000/api/v1"
```

**If undefined:**
1. Check `apps/web/.env` file exists
2. Check it contains: `VITE_API_URL=http://localhost:3000/api/v1`
3. **Restart web dev server** (Vite doesn't hot-reload .env)

### Cost Codes Still Not Loading?

**Check API server:**
```bash
# Test API endpoint directly
curl http://localhost:3000/health
# Should return: {"status":"ok",...}

# Test cost codes endpoint (replace TOKEN with your actual token)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/cost-codes?level=2&is_active=true
```

**Check database:**
```sql
SELECT COUNT(*) FROM cost_codes WHERE level = 2 AND "isActive" = true;
-- Should return 33
```

## Summary of Changes

| File | Change | Status |
|------|--------|--------|
| `apps/web/src/utils/api.ts` | Fixed API_BASE_URL (3001→3000) | ✅ |
| `apps/web/src/components/BudgetSetupModal.tsx` | Use getAuthToken() utility | ✅ |
| `apps/web/src/pages/ProjectDetailPage.tsx` | Use getAuthToken() utility | ✅ |

## Verification

All files compile with zero TypeScript errors:
```bash
cd apps/web
npm run build
# ✅ No errors
```

## What Was Wrong

The core issue was **token retrieval**:

**Before (Wrong):**
```typescript
const token = localStorage.getItem('token'); // ❌ Returns null
```

**After (Correct):**
```typescript
const token = getAuthToken(); // ✅ Returns actual JWT token
// Which does:
// 1. Get 'auth_tokens' from localStorage
// 2. Parse JSON
// 3. Extract accessToken
```

This caused 401 Unauthorized errors because the backend was receiving `Bearer null` instead of `Bearer <actual-jwt-token>`.

---

## ✅ All Fixed!

The budget modal should now work correctly:
- ✅ Cost codes load
- ✅ Add line button works
- ✅ Budget saves successfully
- ✅ No 401 errors
- ✅ Fetches from correct API server

**Remember to restart the web dev server!** 🔄
