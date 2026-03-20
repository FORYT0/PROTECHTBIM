# Enterprise Pages Complete Fix - Change Orders, Daily Reports, Snags

## Overview
Applying the same fixes that were done for Contracts page to the remaining three enterprise pages: Change Orders, Daily Reports, and Snags.

## Fixes Applied

### 1. Backend Services - Add getAllX() Methods

#### ChangeOrderService.ts
- Added `getAllChangeOrders()` method to retrieve all change orders with relations

#### DailyReportService.ts
- Added `getAllDailyReports()` method to retrieve all daily reports with relations

#### SnagService.ts
- Added `getAllSnags()` method to retrieve all snags with relations

### 2. Backend Routes - Add GET / Endpoints

#### change-orders.routes.ts
- Added `GET /` endpoint to fetch all change orders
- Fixed fallback user ID to valid UUID: `'a0077b22-fc68-408c-b1ce-aab3d36855de'`

#### daily-reports.routes.ts
- Added `GET /` endpoint to fetch all daily reports
- Fixed fallback user ID to valid UUID: `'a0077b22-fc68-408c-b1ce-aab3d36855de'`

#### snags.routes.ts
- Added `GET /` endpoint to fetch all snags
- Fixed fallback user ID to valid UUID: `'a0077b22-fc68-408c-b1ce-aab3d36855de'`

### 3. Frontend Services - Add getAllX() Methods

#### changeOrderService.ts
- Added `getAllChangeOrders()` method to fetch from `GET /change-orders`

#### dailyReportService.ts
- Added `getAllDailyReports()` method to fetch from `GET /daily-reports`

#### snagService.ts
- Added `getAllSnags()` method to fetch from `GET /snags`

### 4. Frontend Pages - Implement Real Data Loading

#### ChangeOrdersPage.tsx
- Implemented `loadChangeOrders()` with actual API call
- Changed metrics from mock to calculated from real data
- Updated filter options to use enum VALUES (not KEYS):
  - `Draft`, `Submitted`, `Under Review`, `Approved`, `Rejected`, `Voided`
  - `Low`, `Medium`, `High`, `Critical`
- Removed incorrect string replacements (`.replace('_', ' ')`)

#### DailyReportsPage.tsx
- Implemented `loadReports()` with actual API call
- Changed metrics from mock to calculated from real data
- No enum filters needed (Daily Reports don't have status enums)

#### SnagsPage.tsx
- Implemented `loadSnags()` with actual API call
- Changed metrics from mock to calculated from real data
- Updated filter options to use enum VALUES:
  - Status: `Open`, `In Progress`, `Resolved`, `Verified`, `Closed`
  - Severity: `Critical`, `Major`, `Minor`
- Removed incorrect string replacements

### 5. Frontend Forms - Fix Enum Values

#### ChangeOrderFormModal.tsx
- Changed form option values from enum KEYS to enum VALUES:
  - Reason: `Client Change`, `Site Condition`, `Design Error`, `Regulatory`, `Unforeseen`, `Scope Addition`
  - Priority: `Low`, `Medium`, `High`, `Critical`
- Updated default values to use VALUES
- Changed button from `type="button"` to `type="submit"`

#### DailyReportFormModal.tsx
- No enum changes needed (no enums in Daily Reports)
- Changed button from `type="button"` to `type="submit"`

#### SnagFormModal.tsx
- Changed form option values from enum KEYS to enum VALUES:
  - Severity: `Minor`, `Major`, `Critical`
  - Category: `Defect`, `Incomplete`, `Damage`, `Non-Compliance`
- Updated default values to use VALUES
- Changed button from `type="button"` to `type="submit"`

## Key Enum Mappings

### Change Orders
```typescript
// Reason
CLIENT_CHANGE → "Client Change"
SITE_CONDITION → "Site Condition"
DESIGN_ERROR → "Design Error"
REGULATORY → "Regulatory"
SCOPE_ADDITION → "Scope Addition"
UNFORESEEN → "Unforeseen"

// Status
DRAFT → "Draft"
SUBMITTED → "Submitted"
UNDER_REVIEW → "Under Review"
APPROVED → "Approved"
REJECTED → "Rejected"
VOIDED → "Voided"

// Priority
LOW → "Low"
MEDIUM → "Medium"
HIGH → "High"
CRITICAL → "Critical"
```

### Snags
```typescript
// Severity
MINOR → "Minor"
MAJOR → "Major"
CRITICAL → "Critical"

// Category
DEFECT → "Defect"
INCOMPLETE → "Incomplete"
DAMAGE → "Damage"
NON_COMPLIANCE → "Non-Compliance"

// Status
OPEN → "Open"
IN_PROGRESS → "In Progress"
RESOLVED → "Resolved"
VERIFIED → "Verified"
CLOSED → "Closed"
```

## Testing Checklist

### Change Orders
- [ ] Create change order with all enum values
- [ ] Change orders display on dashboard
- [ ] Metrics calculate correctly from real data
- [ ] Filters work with enum values
- [ ] Status and priority display correctly

### Daily Reports
- [ ] Create daily report
- [ ] Reports display on dashboard
- [ ] Metrics calculate correctly
- [ ] Date filtering works
- [ ] Weather and resource counts display

### Snags
- [ ] Create snag with all severity levels
- [ ] Snags display on dashboard
- [ ] Metrics calculate correctly
- [ ] Filters work with enum values
- [ ] Severity and status display correctly

## Files Modified

### Backend
1. `apps/api/src/services/ChangeOrderService.ts`
2. `apps/api/src/services/DailyReportService.ts`
3. `apps/api/src/services/SnagService.ts`
4. `apps/api/src/routes/change-orders.routes.ts`
5. `apps/api/src/routes/daily-reports.routes.ts`
6. `apps/api/src/routes/snags.routes.ts`

### Frontend
1. `apps/web/src/services/changeOrderService.ts`
2. `apps/web/src/services/dailyReportService.ts`
3. `apps/web/src/services/snagService.ts`
4. `apps/web/src/pages/ChangeOrdersPage.tsx`
5. `apps/web/src/pages/DailyReportsPage.tsx`
6. `apps/web/src/pages/SnagsPage.tsx`
7. `apps/web/src/components/ChangeOrderFormModal.tsx`
8. `apps/web/src/components/DailyReportFormModal.tsx`
9. `apps/web/src/components/SnagFormModal.tsx`

## Status
🔄 IN PROGRESS - Fixes being applied now
