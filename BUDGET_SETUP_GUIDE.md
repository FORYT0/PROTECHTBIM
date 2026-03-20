# Budget Setup Guide - Quick Start

## Prerequisites

Before setting up budgets, ensure you have:
1. ✅ Cost codes seeded in the database (43 standard construction cost codes)
2. ✅ At least one project created
3. ✅ User authenticated with valid JWT token

## Step 1: Run Database Migration

The budget system requires a new database migration to create the `budget_lines` table and update the `budgets` table structure.

```bash
cd apps/api
npm run migration:run
```

Expected output:
```
query: SELECT * FROM "migrations" "migrations" ORDER BY "id" DESC
query: START TRANSACTION
Migration UpdateBudgetStructure1771678000000 has been executed successfully.
query: COMMIT
```

## Step 2: Verify Database Schema

Connect to your PostgreSQL database and verify the tables:

```sql
-- Check budgets table structure
\d budgets

-- Check budget_lines table
\d budget_lines

-- Verify foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'budget_lines';
```

## Step 3: Start the Application

### Start API Server
```bash
cd apps/api
npm run dev
```

The API should start on `http://localhost:3000`

### Start Web App
```bash
cd apps/web
npm run dev
```

The web app should start on `http://localhost:3001`

## Step 4: Create Your First Budget

### Via UI (Recommended)

1. **Navigate to Projects**
   - Go to `http://localhost:3001/projects`
   - Click on any project card to open the project detail page

2. **Open Budget Modal**
   - On the project detail page, find the "Budget" card in the KPI row
   - Click on the Budget card (the entire card is clickable)
   - The Budget Setup Modal will open

3. **Fill Budget Information**
   - **Total Project Budget**: Enter the total budget (e.g., $2,100,000)
   - **Contingency (%)**: Enter contingency percentage (e.g., 10%)
   - The contingency amount will be calculated automatically

4. **Allocate Budget by Cost Code**
   - Click "Add Line" to add budget lines
   - For each line:
     - Select a cost code from the dropdown
     - Enter the budgeted amount
   - Add as many lines as needed

5. **Review Budget Summary**
   - The modal shows:
     - Total Budget
     - Allocated amount and percentage
     - Remaining budget
     - Visual progress bar
   - If over-allocated, the progress bar turns red

6. **Save Budget**
   - Click "Save Budget" button
   - Wait for confirmation
   - The modal will close automatically

### Via API (For Testing)

```bash
# Get authentication token
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# Get cost codes
curl -X GET "http://localhost:3000/api/v1/cost-codes?level=2&is_active=true" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.cost_codes[] | {id, code, name}'

# Create budget (replace PROJECT_ID and COST_CODE_IDs)
curl -X POST "http://localhost:3000/api/v1/projects/PROJECT_ID/budget" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "total_budget": 2100000,
    "contingency_percentage": 10,
    "contingency_amount": 210000,
    "budget_lines": [
      {
        "cost_code_id": "COST_CODE_ID_1",
        "budgeted_amount": 500000
      },
      {
        "cost_code_id": "COST_CODE_ID_2",
        "budgeted_amount": 800000
      },
      {
        "cost_code_id": "COST_CODE_ID_3",
        "budgeted_amount": 600000
      }
    ]
  }'

# Get budget
curl -X GET "http://localhost:3000/api/v1/projects/PROJECT_ID/budget" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

## Step 5: Verify Budget Data

### Check Database
```sql
-- View all budgets
SELECT 
  b.id,
  b."projectId",
  p.name AS project_name,
  b."totalBudget",
  b."contingencyPercentage",
  b."contingencyAmount",
  b."isActive",
  b."createdAt"
FROM budgets b
JOIN projects p ON b."projectId" = p.id
ORDER BY b."createdAt" DESC;

-- View budget lines with cost codes
SELECT 
  bl.id,
  b.name AS budget_name,
  cc.code AS cost_code,
  cc.name AS cost_code_name,
  bl."budgetedAmount",
  bl."actualCost",
  bl."committedCost"
FROM budget_lines bl
JOIN budgets b ON bl."budgetId" = b.id
JOIN cost_codes cc ON bl."costCodeId" = cc.id
WHERE b."isActive" = true
ORDER BY cc.code;

-- Budget summary by project
SELECT 
  p.name AS project_name,
  b."totalBudget",
  SUM(bl."budgetedAmount") AS allocated_budget,
  b."totalBudget" - SUM(bl."budgetedAmount") AS remaining_budget,
  ROUND((SUM(bl."budgetedAmount") / b."totalBudget" * 100)::numeric, 2) AS allocation_percentage
FROM budgets b
JOIN projects p ON b."projectId" = p.id
JOIN budget_lines bl ON bl."budgetId" = b.id
WHERE b."isActive" = true
GROUP BY p.name, b."totalBudget";
```

### Check Activity Logs
```sql
-- View budget-related activities
SELECT 
  al."createdAt",
  u.email AS user_email,
  al."actionType",
  al.description,
  al.metadata
FROM activity_logs al
JOIN users u ON al."userId" = u.id
WHERE al."entityType" = 'Budget'
ORDER BY al."createdAt" DESC;
```

## Common Issues & Solutions

### Issue 1: Cost codes not loading
**Symptom**: Budget modal shows "Loading cost codes..." indefinitely

**Solution**:
1. Verify cost codes exist in database:
   ```sql
   SELECT COUNT(*) FROM cost_codes WHERE level = 2 AND "isActive" = true;
   ```
2. If count is 0, run the cost code seeding migration:
   ```bash
   cd apps/api
   npm run migration:run
   ```

### Issue 2: "Failed to save budget" error
**Symptom**: Error message when clicking "Save Budget"

**Possible causes**:
1. **Invalid cost code IDs**: Ensure selected cost codes exist
2. **Negative amounts**: All amounts must be positive
3. **Missing required fields**: Total budget and at least one budget line required
4. **Authentication**: Token expired or invalid

**Solution**:
- Check browser console for detailed error
- Verify authentication token is valid
- Ensure all validation rules are met

### Issue 3: Budget not appearing after save
**Symptom**: Budget saved successfully but not showing in UI

**Solution**:
1. Refresh the project detail page
2. Check if budget was created:
   ```sql
   SELECT * FROM budgets WHERE "projectId" = 'YOUR_PROJECT_ID' ORDER BY "createdAt" DESC LIMIT 1;
   ```
3. Check browser console for errors

### Issue 4: Multiple active budgets for same project
**Symptom**: Multiple budgets showing as active

**Solution**:
The system should auto-deactivate old budgets. If this doesn't happen:
```sql
-- Manually deactivate old budgets (keep only the latest)
UPDATE budgets 
SET "isActive" = false 
WHERE "projectId" = 'YOUR_PROJECT_ID' 
  AND id != (
    SELECT id FROM budgets 
    WHERE "projectId" = 'YOUR_PROJECT_ID' 
    ORDER BY "createdAt" DESC 
    LIMIT 1
  );
```

## Example Budget Setup

Here's a complete example for a $2.1M construction project:

### Budget Breakdown
- **Total Budget**: $2,100,000
- **Contingency**: 10% ($210,000)

### Budget Lines by Cost Code

| Cost Code | Description | Budgeted Amount |
|-----------|-------------|-----------------|
| 01.01 | Site Preparation | $150,000 |
| 01.02 | Demolition | $80,000 |
| 02.01 | Earthwork | $200,000 |
| 03.01 | Concrete Formwork | $250,000 |
| 03.02 | Concrete Reinforcement | $180,000 |
| 03.03 | Cast-in-Place Concrete | $320,000 |
| 04.01 | Masonry | $150,000 |
| 05.01 | Structural Steel | $400,000 |
| 06.01 | Rough Carpentry | $120,000 |
| 07.01 | Waterproofing | $100,000 |

**Total Allocated**: $1,950,000
**Remaining**: $150,000 (for additional allocations)

## Next Steps

After setting up your budget:

1. **Track Costs**: Create cost entries linked to cost codes
2. **Monitor Variance**: Compare budgeted vs actual costs
3. **Update Budget**: Revise budget as project progresses
4. **Generate Reports**: Use budget data for financial reporting

## Support

If you encounter issues:
1. Check the console logs (browser and API server)
2. Verify database schema matches expected structure
3. Ensure all migrations have run successfully
4. Review the `BUDGET_SYSTEM_IMPLEMENTATION.md` for detailed documentation

---

**Happy Budgeting! 💰**
