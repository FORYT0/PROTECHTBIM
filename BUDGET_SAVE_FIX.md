# Budget Save Fix - Complete

## Issue
Budget creation was failing with error:
```
invalid input value for enum activity_logs_entitytype_enum: "Budget"
```

## Root Cause
The PostgreSQL enum `activity_logs_entitytype_enum` was missing the 'Budget' value. The TypeScript entity had it defined, but the database migration that created the enum didn't include it.

## Solution

### 1. Database Migration
Created migration `1771920000000-AddBudgetToActivityLogEnum.ts` to add missing enum values:
- Added 'Budget' to `activity_logs_entitytype_enum`
- Added 'APPROVED' to `activity_logs_actiontype_enum`

Migration ran successfully:
```
✅ Successfully ran 1 migration(s):
  - AddBudgetToActivityLogEnum1771920000000
```

### 2. UI Improvement - Sticky Header
Updated `BudgetSetupModal.tsx` to improve UX:
- Made "Total Project Budget" section sticky at the top
- Made only the "Budget Allocation by Cost Code" section scrollable
- Better visual separation between summary and line items

## Layout Changes

### Before
- Entire modal content scrolled together
- Budget summary could scroll out of view when adding many lines

### After
- **Sticky Section** (top, always visible):
  - Total Budget & Contingency inputs
  - Budget Summary (Total/Allocated/Remaining)
  - Progress bar
  
- **Scrollable Section** (bottom):
  - Budget lines list
  - Add Line button
  - Individual cost code allocations

## Files Modified
1. `apps/api/src/migrations/1771920000000-AddBudgetToActivityLogEnum.ts` - NEW
2. `apps/web/src/components/BudgetSetupModal.tsx` - UPDATED

## Testing
- Budget creation now works without enum errors
- Activity logs are properly created for budget operations
- UI provides better UX with sticky summary section
- All budget lines remain scrollable independently

## Status
✅ Complete - Budget save functionality restored
✅ Complete - UI improved with sticky header layout
