# Cost Entry System - Migration Guide

## Overview
This guide walks you through running the Phase 1 migrations for the Cost Entry System.

## Prerequisites
- PostgreSQL database running
- Database connection configured in `.env`
- TypeORM CLI configured

## Migration Order

The migrations will run in this order (automatically handled by TypeORM):

1. **1771677000000-CreateCostCodes.ts** - Creates cost_codes table
2. **1771677100000-CreateVendors.ts** - Creates vendors table
3. **1771677200000-CreateResourceRates.ts** - Creates resource_rates table (depends on cost_codes)
4. **1771677300000-UpdateCostEntriesStructure.ts** - Restructures cost_entries table (depends on cost_codes, vendors)
5. **1771677400000-UpdateTimeEntriesForCostTracking.ts** - Adds cost tracking fields to time_entries
6. **1771677500000-SeedStandardCostCodes.ts** - Seeds standard cost code structure

## Running Migrations

### Option 1: Using npm script (Recommended)
```bash
cd apps/api
npm run migration:run
```

### Option 2: Using TypeORM CLI directly
```bash
cd apps/api
npx typeorm migration:run -d src/config/data-source.ts
```

### Option 3: Using the run-migrations script
```bash
cd apps/api
npx ts-node scripts/run-migrations.ts
```

## Verification Steps

### 1. Check Migration Status
```bash
cd apps/api
npm run migration:show
```

Expected output should show all 6 migrations as "executed".

### 2. Verify Cost Codes Table
```sql
-- Connect to your database
psql -U your_user -d your_database

-- Check cost codes were seeded
SELECT code, name, level, parent_code_id 
FROM cost_codes 
ORDER BY code;

-- Should return 43 rows (10 Level-1 + 33 Level-2)
```

Expected structure:
```
 code  |        name         | level | parent_code_id 
-------+---------------------+-------+----------------
 01    | SITE PREPARATION    |     1 | NULL
 01.01 | Site Clearance      |     2 | <uuid>
 01.02 | Demolition          |     2 | <uuid>
 01.03 | Earthworks          |     2 | <uuid>
 02    | FOUNDATION          |     1 | NULL
 ...
```

### 3. Verify Vendors Table
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendors'
ORDER BY ordinal_position;
```

Should have columns: id, vendor_code, vendor_name, vendor_type, contact_person, email, phone, address, payment_terms, tax_id, bank_account, is_active, rating, created_at, updated_at

### 4. Verify Resource Rates Table
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resource_rates'
ORDER BY ordinal_position;
```

Should have columns: id, user_id, role, hourly_rate, overtime_rate, overtime_multiplier, cost_category, cost_code_id, effective_from, effective_to, is_active, created_at, updated_at

### 5. Verify Cost Entries Table (New Structure)
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cost_entries'
ORDER BY ordinal_position;
```

Should have NEW columns: entry_number, project_id, work_package_id, cost_code_id, cost_category, vendor_id, quantity, unit, unit_cost, total_cost, invoice_number, invoice_date, payment_status, is_billable, is_committed, commitment_id, entry_date, entry_source, created_by, approved_by, approved_at, attachment_ids

Should NOT have OLD columns: userId, type, amount, date, reference, billable, currency

### 6. Verify Time Entries Table (Enhanced)
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'time_entries'
WHERE column_name IN ('hourly_rate', 'labor_cost', 'cost_entry_id', 'is_overtime');
```

Should return 4 new columns.

## Rollback (If Needed)

⚠️ **WARNING**: Rolling back will delete all data in the affected tables!

### Rollback all Phase 1 migrations
```bash
cd apps/api
npm run migration:revert
# Run 6 times to revert all 6 migrations
```

### Rollback specific number of migrations
```bash
# Revert last 3 migrations
npm run migration:revert
npm run migration:revert
npm run migration:revert
```

## Troubleshooting

### Issue: "relation already exists"
**Solution**: The table already exists. Either:
1. Drop the table manually: `DROP TABLE table_name CASCADE;`
2. Or skip this migration if it's already applied

### Issue: "column does not exist" in UpdateCostEntriesStructure
**Solution**: The old cost_entries table structure is different. Options:
1. Drop and recreate: `DROP TABLE cost_entries CASCADE;` then re-run migration
2. Or manually adjust the migration to match your current structure

### Issue: "foreign key constraint fails"
**Solution**: Ensure migrations run in order. The order is critical because:
- resource_rates depends on cost_codes
- cost_entries depends on cost_codes and vendors

### Issue: "enum type already exists"
**Solution**: Drop the enum type first:
```sql
DROP TYPE IF EXISTS cost_category CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS entry_source CASCADE;
DROP TYPE IF EXISTS vendor_type CASCADE;
```

## Post-Migration Tasks

### 1. Update TypeORM Data Source
Ensure `apps/api/src/config/data-source.ts` includes all new entities:
```typescript
import { CostCode, Vendor, ResourceRate } from '../entities';
```

### 2. Restart API Server
```bash
cd apps/api
npm run dev
```

### 3. Test Entity Loading
```bash
# In your API, try to query the new entities
curl http://localhost:3000/api/cost-codes
curl http://localhost:3000/api/vendors
```

## Next Steps After Migration

1. ✅ Migrations complete
2. ⏭️ Create Repositories (CostCodeRepository, VendorRepository, ResourceRateRepository)
3. ⏭️ Create Services (CostCodeService, VendorService, ResourceRateService)
4. ⏭️ Create API Routes (cost-codes.routes.ts, vendors.routes.ts, resource-rates.routes.ts)
5. ⏭️ Create Shared Types for frontend
6. ⏭️ Create UI Components

## Database Backup Recommendation

Before running migrations in production:
```bash
# Backup your database
pg_dump -U your_user -d your_database > backup_before_cost_entry_migration.sql

# Restore if needed
psql -U your_user -d your_database < backup_before_cost_entry_migration.sql
```

## Success Indicators

✅ All 6 migrations show as "executed" in migration:show
✅ cost_codes table has 43 rows (10 Level-1 + 33 Level-2)
✅ vendors table exists with correct structure
✅ resource_rates table exists with correct structure
✅ cost_entries table has new structure (20+ columns)
✅ time_entries table has 4 new columns
✅ No foreign key constraint errors
✅ API server starts without errors
✅ TypeORM can load all entities

---

**Ready to proceed with Phase 2: Repositories & Services!**

