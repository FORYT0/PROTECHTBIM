# Test Change Order Flow - Contracts Endpoint

This test verifies that the "New Change Order" form can successfully load contracts when a project is selected.

## Test Scenario

### Step 1: Frontend selects a project
- User navigates to "New Change Order" form
- User selects a project from the Project dropdown
- Expected: Contract dropdown shows "Loading contracts..."

### Step 2: Backend receives request
- Request sent to: `GET /api/v1/contracts/project/:projectId/all`
- Route handler logs: `📝 Fetching ALL contracts for project: :projectId`
- Service queries database for all contracts for that project

### Step 3: Frontend receives response
- Backend returns: `{ "contracts": [...] }`
- Frontend populates Contract dropdown with fetched contracts
- Expected: Contract dropdown shows available contracts for selected project

## Endpoint Details

**Route:** `GET /api/v1/contracts/project/:projectId/all`

**Authentication:** Requires valid JWT token

**Response Format:**
```json
{
  "contracts": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "contractNumber": "CNT-001",
      "contractType": "FIXED_PRICE",
      "clientName": "Client Name",
      "originalContractValue": 500000,
      "originalDurationDays": 365,
      "startDate": "2024-01-01T00:00:00Z",
      "completionDate": "2024-12-31T00:00:00Z",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Current Status

### ✅ Backend Ready
- API Server running on http://localhost:8080
- Database connected: `protecht_bim@localhost:15432`
- Redis cache connected: `localhost:16379`
- WebSocket server initialized
- Contracts route mounted at `/api/v1/contracts`

### ✅ Route Configuration
- Route prioritized to prevent shadowing
- Authentication middleware properly configured
- Logging added for debugging
- Moved above `/:id` and `/project/:projectId` routes

### ✅ Port Status
- Port 8080: ✅ CLEANED (zombie process terminated)
- Fresh API server instance running

## Testing Plan

1. Test health check endpoint
2. Test contracts endpoint without auth (should fail)
3. Test contracts endpoint with auth
4. Test specific project's contracts
5. End-to-end Change Order creation flow

## Zombie Process Resolution

**Problem Identified:**
- Process PID 29936 was occupying port 8080
- Old server instance was not responding to new requests
- Fresh code deployments not being served

**Resolution Applied:**
- Terminated zombie process: `taskkill /PID 29936 /F`
- Verified port 8080 is free: `netstat -ano | Select-String ":8080"` → No output
- Started fresh API server: `npm run dev`
- Confirmed new instance running with latest code

## Next Steps

1. Verify contracts endpoint responds correctly
2. Test with valid JWT token from frontend
3. Load Change Order form in browser
4. Select a project
5. Verify contracts dropdown populates
6. Create new change order
7. Monitor logs for any errors
