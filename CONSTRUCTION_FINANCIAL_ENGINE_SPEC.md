# Construction Financial Engine - Implementation Specification

## Overview
Transform PROTECHT BIM into a true construction financial management system with proper double-entry accounting, Chart of Accounts, and construction-specific financial intelligence.

## LEVEL 1 — CORE FINANCIAL FOUNDATION

### 1. Chart of Accounts (COA)

**Database Schema:**
```typescript
ChartOfAccounts {
  id: string (UUID)
  account_code: string (e.g., "1000", "2000", "4000")
  account_name: string
  account_type: AccountType (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
  account_category: string (e.g., "Current Assets", "Fixed Assets")
  parent_account_id: string | null (for sub-accounts)
  is_active: boolean
  normal_balance: 'DEBIT' | 'CREDIT'
  created_at: timestamp
  updated_at: timestamp
}
```

**Standard COA Structure:**
```
ASSETS (1000-1999)
  1000 - Cash
  1100 - Accounts Receivable
  1200 - Work in Progress (WIP)
  1300 - Inventory
  1400 - Prepaid Expenses
  1500 - Fixed Assets
  1600 - Accumulated Depreciation

LIABILITIES (2000-2999)
  2000 - Accounts Payable
  2100 - Accrued Expenses
  2200 - Retention Payable
  2300 - Loans Payable
  2400 - Deferred Revenue

EQUITY (3000-3999)
  3000 - Owner's Equity
  3100 - Retained Earnings
  3200 - Current Year Earnings

REVENUE (4000-4999)
  4000 - Contract Revenue
  4100 - Variation Revenue
  4200 - Retention Revenue
  4300 - Other Revenue

EXPENSES (5000-5999)
  5000 - Labor Cost
  5100 - Material Cost
  5200 - Equipment Cost
  5300 - Subcontractor Cost
  5400 - Overhead Cost
  5500 - Administrative Cost
```

### 2. Double-Entry Journal System

**Database Schema:**
```typescript
JournalEntry {
  id: string (UUID)
  entry_number: string (auto-generated: JE-2026-0001)
  entry_date: date
  description: string
  reference_type: string (INVOICE, PAYMENT, ADJUSTMENT, etc.)
  reference_id: string | null
  project_id: string | null
  status: 'DRAFT' | 'POSTED' | 'REVERSED'
  created_by: string
  posted_at: timestamp | null
  reversed_at: timestamp | null
  created_at: timestamp
  updated_at: timestamp
}

JournalEntryLine {
  id: string (UUID)
  journal_entry_id: string (FK)
  account_id: string (FK to ChartOfAccounts)
  debit_amount: decimal(15,2)
  credit_amount: decimal(15,2)
  description: string
  project_id: string | null
  cost_code_id: string | null
  line_number: number
}
```

**Double-Entry Rules:**
- Every journal entry must balance: Σ Debits = Σ Credits
- Minimum 2 lines per entry
- Cannot post unbalanced entries
- Audit trail for all changes

**Example Transactions:**

```typescript
// Invoice from supplier for concrete
{
  entry_date: "2026-02-23",
  description: "Concrete delivery - Invoice #12345",
  reference_type: "SUPPLIER_INVOICE",
  reference_id: "inv-12345",
  project_id: "proj-001",
  lines: [
    {
      account_code: "5100", // Material Cost
      debit_amount: 10000.00,
      credit_amount: 0,
      description: "Concrete materials"
    },
    {
      account_code: "2000", // Accounts Payable
      debit_amount: 0,
      credit_amount: 10000.00,
      description: "Supplier ABC Ltd"
    }
  ]
}

// Payment to supplier
{
  entry_date: "2026-02-25",
  description: "Payment to ABC Ltd - Invoice #12345",
  reference_type: "PAYMENT",
  reference_id: "pay-789",
  lines: [
    {
      account_code: "2000", // Accounts Payable
      debit_amount: 10000.00,
      credit_amount: 0
    },
    {
      account_code: "1000", // Cash
      debit_amount: 0,
      credit_amount: 10000.00
    }
  ]
}
```

## LEVEL 2 — CONSTRUCTION-SPECIFIC FINANCIAL LOGIC

### 3. Budget Control System

**Database Schema:**
```typescript
ProjectBudget {
  id: string (UUID)
  project_id: string (FK)
  cost_code_id: string (FK)
  original_budget: decimal(15,2)
  approved_variations: decimal(15,2)
  revised_budget: decimal(15,2) // calculated: original + variations
  committed_cost: decimal(15,2) // from POs/commitments
  actual_cost: decimal(15,2) // from invoices
  forecast_at_completion: decimal(15,2)
  available_budget: decimal(15,2) // calculated
  budget_status: 'UNDER' | 'ON_TRACK' | 'WARNING' | 'EXCEEDED'
  warning_threshold: decimal(5,2) // percentage (e.g., 90%)
  created_at: timestamp
  updated_at: timestamp
}

BudgetVariation {
  id: string (UUID)
  project_id: string (FK)
  variation_number: string
  description: string
  amount: decimal(15,2)
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approved_by: string | null
  approved_at: timestamp | null
  created_at: timestamp
}
```

**Budget Formulas:**
```typescript
revised_budget = original_budget + approved_variations
available_budget = revised_budget - committed_cost - actual_cost
budget_utilization = (committed_cost + actual_cost) / revised_budget * 100
forecast_variance = forecast_at_completion - revised_budget
```

### 4. Commitment System

**Database Schema:**
```typescript
Commitment {
  id: string (UUID)
  commitment_number: string (PO-2026-0001)
  commitment_type: 'PURCHASE_ORDER' | 'SUBCONTRACT' | 'RENTAL'
  project_id: string (FK)
  vendor_id: string (FK)
  description: string
  total_amount: decimal(15,2)
  invoiced_amount: decimal(15,2)
  paid_amount: decimal(15,2)
  remaining_commitment: decimal(15,2) // calculated
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  commitment_date: date
  expected_completion_date: date | null
  created_at: timestamp
  updated_at: timestamp
}

CommitmentLine {
  id: string (UUID)
  commitment_id: string (FK)
  cost_code_id: string (FK)
  description: string
  quantity: decimal(10,2)
  unit_price: decimal(15,2)
  line_amount: decimal(15,2)
  invoiced_amount: decimal(15,2)
  remaining_amount: decimal(15,2)
}
```

**Commitment Tracking:**
```typescript
remaining_commitment = total_amount - invoiced_amount
commitment_utilization = invoiced_amount / total_amount * 100
```

### 5. Work In Progress (WIP) & Revenue Recognition

**Database Schema:**
```typescript
WIPLedger {
  id: string (UUID)
  project_id: string (FK)
  period_end_date: date
  contract_value: decimal(15,2)
  total_estimated_cost: decimal(15,2)
  actual_cost_to_date: decimal(15,2)
  percent_complete: decimal(5,2)
  earned_revenue: decimal(15,2)
  billed_to_date: decimal(15,2)
  over_under_billing: decimal(15,2) // calculated
  gross_profit: decimal(15,2)
  gross_profit_percentage: decimal(5,2)
  created_at: timestamp
}
```

**Revenue Recognition Formulas:**
```typescript
// Percentage of Completion (POC) - Cost-to-Cost Method
percent_complete = actual_cost_to_date / total_estimated_cost * 100
earned_revenue = contract_value * (percent_complete / 100)
over_under_billing = billed_to_date - earned_revenue
gross_profit = earned_revenue - actual_cost_to_date
gross_profit_percentage = (gross_profit / earned_revenue) * 100
```

## LEVEL 3 — COST CONTROL ENGINE

### Earned Value Management (EVM)

**Database Schema:**
```typescript
EarnedValueMetrics {
  id: string (UUID)
  project_id: string (FK)
  measurement_date: date
  planned_value: decimal(15,2) // PV - Budgeted cost of work scheduled
  earned_value: decimal(15,2) // EV - Budgeted cost of work performed
  actual_cost: decimal(15,2) // AC - Actual cost of work performed
  cost_variance: decimal(15,2) // CV = EV - AC
  schedule_variance: decimal(15,2) // SV = EV - PV
  cost_performance_index: decimal(5,4) // CPI = EV / AC
  schedule_performance_index: decimal(5,4) // SPI = EV / PV
  estimate_at_completion: decimal(15,2) // EAC
  estimate_to_complete: decimal(15,2) // ETC
  variance_at_completion: decimal(15,2) // VAC
  created_at: timestamp
}
```

**EVM Formulas:**
```typescript
CV = EV - AC  // Negative = over budget
SV = EV - PV  // Negative = behind schedule
CPI = EV / AC // < 1.0 = over budget
SPI = EV / PV // < 1.0 = behind schedule
EAC = BAC / CPI // Estimate at Completion
ETC = EAC - AC // Estimate to Complete
VAC = BAC - EAC // Variance at Completion
TCPI = (BAC - EV) / (BAC - AC) // To-Complete Performance Index
```

## LEVEL 4 — CASH FLOW SYSTEM

**Database Schema:**
```typescript
ClientInvoice {
  id: string (UUID)
  invoice_number: string
  project_id: string (FK)
  client_id: string (FK)
  invoice_date: date
  due_date: date
  subtotal: decimal(15,2)
  retention_percentage: decimal(5,2)
  retention_amount: decimal(15,2)
  tax_amount: decimal(15,2)
  total_amount: decimal(15,2)
  paid_amount: decimal(15,2)
  outstanding_amount: decimal(15,2)
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  payment_terms: string
  created_at: timestamp
}

RetentionTracking {
  id: string (UUID)
  project_id: string (FK)
  retention_type: 'RECEIVABLE' | 'PAYABLE'
  entity_id: string // client_id or vendor_id
  total_retention: decimal(15,2)
  released_retention: decimal(15,2)
  outstanding_retention: decimal(15,2)
  release_conditions: string
  expected_release_date: date | null
}

PaymentCertificate {
  id: string (UUID)
  certificate_number: string
  project_id: string (FK)
  period_start: date
  period_end: date
  work_completed_value: decimal(15,2)
  previous_certificates_total: decimal(15,2)
  current_certificate_value: decimal(15,2)
  retention_held: decimal(15,2)
  amount_due: decimal(15,2)
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID'
  created_at: timestamp
}
```

## LEVEL 5 — ACCOUNTS PAYABLE MODULE

**Database Schema:**
```typescript
Vendor {
  id: string (UUID)
  vendor_code: string
  vendor_name: string
  vendor_type: 'SUPPLIER' | 'SUBCONTRACTOR' | 'CONSULTANT'
  contact_person: string
  email: string
  phone: string
  payment_terms: string
  tax_id: string
  is_active: boolean
  created_at: timestamp
}

SupplierInvoice {
  id: string (UUID)
  invoice_number: string
  vendor_id: string (FK)
  project_id: string | null (FK)
  commitment_id: string | null (FK)
  invoice_date: date
  due_date: date
  subtotal: decimal(15,2)
  tax_amount: decimal(15,2)
  total_amount: decimal(15,2)
  paid_amount: decimal(15,2)
  outstanding_amount: decimal(15,2)
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PARTIAL' | 'PAID' | 'REJECTED'
  approval_workflow_id: string | null
  created_at: timestamp
}

PaymentBatch {
  id: string (UUID)
  batch_number: string
  payment_date: date
  total_amount: decimal(15,2)
  payment_method: 'CHECK' | 'WIRE' | 'ACH' | 'CREDIT_CARD'
  status: 'DRAFT' | 'APPROVED' | 'PROCESSED'
  created_at: timestamp
}
```

## SYSTEM ARCHITECTURE

### Three-Layer Architecture

```
┌─────────────────────────────────────┐
│     REPORTING LAYER                 │
│  - Financial Statements             │
│  - Budget Reports                   │
│  - WIP Reports                      │
│  - Cash Flow Forecasts              │
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│   PROJECT COST LAYER                │
│  - Budget Management                │
│  - Commitment Tracking              │
│  - Cost Allocation                  │
│  - EVM Calculations                 │
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│   TRANSACTION LAYER                 │
│  - Journal Entries                  │
│  - Double-Entry Engine              │
│  - Account Balances                 │
│  - Audit Trail                      │
└─────────────────────────────────────┘
```

### Financial Engine Service

```typescript
class FinancialEngineService {
  // Core Accounting
  createJournalEntry(entry: JournalEntryDTO): Promise<JournalEntry>
  postJournalEntry(entryId: string): Promise<void>
  reverseJournalEntry(entryId: string, reason: string): Promise<JournalEntry>
  getAccountBalance(accountId: string, asOfDate: Date): Promise<decimal>
  
  // Budget Management
  createProjectBudget(budget: ProjectBudgetDTO): Promise<ProjectBudget>
  updateBudget(budgetId: string, updates: Partial<ProjectBudgetDTO>): Promise<ProjectBudget>
  checkBudgetAvailability(projectId: string, costCodeId: string, amount: decimal): Promise<BudgetCheckResult>
  calculateBudgetVariance(projectId: string): Promise<BudgetVarianceReport>
  
  // Commitment Tracking
  createCommitment(commitment: CommitmentDTO): Promise<Commitment>
  recordInvoiceAgainstCommitment(commitmentId: string, invoiceAmount: decimal): Promise<void>
  getRemainingCommitment(commitmentId: string): Promise<decimal>
  
  // Revenue Recognition
  calculatePercentComplete(projectId: string): Promise<decimal>
  recognizeRevenue(projectId: string, periodEnd: Date): Promise<WIPLedger>
  calculateOverUnderBilling(projectId: string): Promise<decimal>
  
  // EVM Calculations
  calculateEarnedValue(projectId: string, measurementDate: Date): Promise<EarnedValueMetrics>
  getCostPerformanceIndex(projectId: string): Promise<decimal>
  getSchedulePerformanceIndex(projectId: string): Promise<decimal>
  forecastAtCompletion(projectId: string): Promise<decimal>
  
  // Cash Flow
  generateClientInvoice(invoice: ClientInvoiceDTO): Promise<ClientInvoice>
  recordPayment(invoiceId: string, payment: PaymentDTO): Promise<void>
  calculateRetention(projectId: string): Promise<RetentionSummary>
  forecastCashFlow(projectId: string, periods: number): Promise<CashFlowForecast[]>
  
  // Financial Statements
  generateProfitLoss(projectId: string | null, startDate: Date, endDate: Date): Promise<ProfitLossStatement>
  generateBalanceSheet(asOfDate: Date): Promise<BalanceSheet>
  generateCashFlowStatement(startDate: Date, endDate: Date): Promise<CashFlowStatement>
  generateWIPReport(asOfDate: Date): Promise<WIPReport>
}
```

## REQUIRED REPORTS

### 1. Profit & Loss per Project
- Revenue by type
- Costs by category
- Gross profit
- Overhead allocation
- Net profit

### 2. Consolidated P&L
- All projects combined
- Company-wide view
- Period comparison

### 3. Balance Sheet
- Assets, Liabilities, Equity
- As of specific date
- Comparative periods

### 4. Cash Flow Statement
- Operating activities
- Investing activities
- Financing activities

### 5. Budget vs Actual
- By cost code
- By project
- Variance analysis
- Forecast to complete

### 6. Committed Cost Report
- Open commitments
- Invoiced vs committed
- Remaining commitments

### 7. WIP Report
- Contract value
- Costs to date
- Percent complete
- Earned revenue
- Billed to date
- Over/under billing

### 8. Aging Report
- Accounts receivable aging
- Accounts payable aging
- By vendor/client
- By project

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)
- [ ] Chart of Accounts entity and migration
- [ ] Journal Entry entities and migration
- [ ] Double-entry validation logic
- [ ] Basic COA seeding
- [ ] Journal entry creation API

### Phase 2: Budget System (Week 3)
- [ ] Project Budget entities
- [ ] Budget variation tracking
- [ ] Budget availability checks
- [ ] Budget warning thresholds
- [ ] Budget APIs

### Phase 3: Commitments (Week 4)
- [ ] Commitment entities
- [ ] PO/Subcontract creation
- [ ] Invoice matching to commitments
- [ ] Remaining commitment calculations
- [ ] Commitment APIs

### Phase 4: Revenue Recognition (Week 5)
- [ ] WIP Ledger entity
- [ ] POC calculation logic
- [ ] Revenue recognition engine
- [ ] Over/under billing tracking
- [ ] WIP APIs

### Phase 5: EVM (Week 6)
- [ ] EVM metrics entity
- [ ] EVM calculation engine
- [ ] CPI/SPI tracking
- [ ] Forecast calculations
- [ ] EVM APIs

### Phase 6: Cash Flow (Week 7)
- [ ] Client invoice entities
- [ ] Retention tracking
- [ ] Payment certificates
- [ ] Cash flow forecasting
- [ ] Invoice/Payment APIs

### Phase 7: AP Module (Week 8)
- [ ] Vendor master
- [ ] Supplier invoice processing
- [ ] Approval workflows
- [ ] Payment batching
- [ ] AP APIs

### Phase 8: Reporting (Week 9-10)
- [ ] Financial statement generators
- [ ] Budget reports
- [ ] WIP reports
- [ ] Aging reports
- [ ] Report APIs

### Phase 9: UI Integration (Week 11-12)
- [ ] Financial dashboard
- [ ] Budget management UI
- [ ] Invoice processing UI
- [ ] Report viewers
- [ ] Chart of accounts management

### Phase 10: Testing & Refinement (Week 13-14)
- [ ] Integration testing
- [ ] Financial accuracy validation
- [ ] Performance optimization
- [ ] Documentation
- [ ] User training materials

## SUCCESS CRITERIA

✅ Every financial transaction creates balanced journal entries
✅ Budget control prevents overspending
✅ Commitment tracking shows true project exposure
✅ Revenue recognition follows POC method
✅ EVM metrics calculate automatically
✅ Cash flow forecasting is accurate
✅ All financial reports balance
✅ Audit trail is complete
✅ System passes accounting review

---

**This transforms PROTECHT BIM from a project management tool into a true Construction Financial Management System.**
