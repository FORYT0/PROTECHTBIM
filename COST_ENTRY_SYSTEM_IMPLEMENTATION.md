# Cost Entry System - Implementation Plan

## Overview
Build a proper structured cost entry system that feeds the financial engine with accurate, categorized data. This is the foundation for all financial reporting and control.

## STEP 1 — DATA ENTRY SOURCES

### Cost Entry Sources:
1. ✅ **Manual Cost Entries** - Materials, equipment, subcontractor invoices
2. ✅ **Time Entries** - Labor costs (auto-calculated from time logs)
3. ✅ **Budget Allocations** - Planned costs
4. ✅ **Purchase Orders** - Committed costs
5. ✅ **Variation Orders** - Change orders
6. ✅ **CSV Imports** - Bulk data upload
7. 🔄 **API Integrations** - Future: accounting software sync

## STEP 2 — COST CODES SYSTEM (CRITICAL)

### Database Schema

```typescript
// Cost Code Hierarchy
CostCode {
  id: string (UUID)
  code: string (e.g., "01", "01.01", "01.01.001")
  name: string
  description: string
  parent_code_id: string | null (for hierarchy)
  level: number (1, 2, 3 for hierarchy depth)
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

### Standard Cost Code Structure

```
01 - SITE PREPARATION
  01.01 - Site Clearance
  01.02 - Demolition
  01.03 - Earthworks

02 - FOUNDATION
  02.01 - Excavation
  02.02 - Concrete Foundation
  02.03 - Waterproofing

03 - CONCRETE WORKS
  03.01 - Formwork
  03.02 - Reinforcement
  03.03 - Concrete Pour
  03.04 - Finishing

04 - STRUCTURAL STEEL
  04.01 - Steel Fabrication
  04.02 - Steel Erection
  04.03 - Connections

05 - MASONRY
  05.01 - Blockwork
  05.02 - Brickwork
  05.03 - Stone Cladding

06 - ROOFING
  06.01 - Roof Structure
  06.02 - Roof Covering
  06.03 - Waterproofing

07 - MEP (Mechanical, Electrical, Plumbing)
  07.01 - HVAC
  07.02 - Electrical
  07.03 - Plumbing
  07.04 - Fire Protection

08 - FINISHES
  08.01 - Flooring
  08.02 - Wall Finishes
  08.03 - Ceiling
  08.04 - Painting

09 - EXTERNAL WORKS
  09.01 - Landscaping
  09.02 - Paving
  09.03 - Drainage

10 - PRELIMINARIES
  10.01 - Site Setup
  10.02 - Temporary Works
  10.03 - Site Management
```

## STEP 3 — COST ENTRY ENTITY

### Database Schema

```typescript
CostEntry {
  id: string (UUID)
  entry_number: string (auto: CE-2026-0001)
  project_id: string (FK) *required
  work_package_id: string | null (FK)
  cost_code_id: string (FK) *required
  cost_category: CostCategory *required
  vendor_id: string | null (FK)
  
  // Financial Details
  description: string *required
  quantity: decimal(10,2)
  unit: string (e.g., "m3", "ton", "hours")
  unit_cost: decimal(15,2)
  total_cost: decimal(15,2) *required (auto-calculated)
  
  // Invoice Details
  invoice_number: string | null
  invoice_date: date | null
  payment_status: PaymentStatus
  
  // Classification
  is_billable: boolean (default: true)
  is_committed: boolean (default: false)
  commitment_id: string | null (FK to PO)
  
  // Metadata
  entry_date: date *required
  entry_source: EntrySource
  created_by: string (FK)
  approved_by: string | null (FK)
  approved_at: timestamp | null
  
  // Attachments
  attachment_ids: string[] (array of attachment IDs)
  
  created_at: timestamp
  updated_at: timestamp
}

enum CostCategory {
  LABOR = 'LABOR',
  MATERIAL = 'MATERIAL',
  EQUIPMENT = 'EQUIPMENT',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  OVERHEAD = 'OVERHEAD',
  OTHER = 'OTHER'
}

enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

enum EntrySource {
  MANUAL = 'MANUAL',
  TIME_ENTRY = 'TIME_ENTRY',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  IMPORT = 'IMPORT',
  API = 'API'
}
```

## STEP 4 — VENDOR MANAGEMENT

### Database Schema

```typescript
Vendor {
  id: string (UUID)
  vendor_code: string (auto: VEN-001)
  vendor_name: string *required
  vendor_type: VendorType
  
  // Contact Information
  contact_person: string
  email: string
  phone: string
  address: string
  
  // Financial
  payment_terms: string (e.g., "Net 30")
  tax_id: string
  bank_account: string
  
  // Status
  is_active: boolean (default: true)
  rating: number (1-5)
  
  created_at: timestamp
  updated_at: timestamp
}

enum VendorType {
  SUPPLIER = 'SUPPLIER',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  CONSULTANT = 'CONSULTANT',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  OTHER = 'OTHER'
}
```

## STEP 5 — RESOURCE RATES (TIME → COST)

### Database Schema

```typescript
ResourceRate {
  id: string (UUID)
  user_id: string (FK) *required
  
  // Rate Information
  role: string (e.g., "Project Manager", "Site Engineer")
  hourly_rate: decimal(10,2) *required
  overtime_rate: decimal(10,2)
  overtime_multiplier: decimal(3,2) (e.g., 1.5 for time-and-a-half)
  
  // Cost Allocation
  cost_category: CostCategory (default: LABOR)
  cost_code_id: string | null (FK) (default labor cost code)
  
  // Validity
  effective_from: date *required
  effective_to: date | null
  is_active: boolean (default: true)
  
  created_at: timestamp
  updated_at: timestamp
}
```

### Time Entry Enhancement

```typescript
// Extend existing TimeEntry entity
TimeEntry {
  // ... existing fields ...
  
  // Add these fields:
  hourly_rate: decimal(10,2) (captured at time of entry)
  labor_cost: decimal(15,2) (auto-calculated: hours * rate)
  cost_entry_id: string | null (FK) (link to generated cost entry)
  is_overtime: boolean (default: false)
}
```

## STEP 6 — BUDGET SYSTEM

### Database Schema

```typescript
ProjectBudget {
  id: string (UUID)
  project_id: string (FK) *required
  
  // Budget Breakdown
  total_budget: decimal(15,2) *required
  contingency_percentage: decimal(5,2) (e.g., 10%)
  contingency_amount: decimal(15,2)
  
  // Status
  status: BudgetStatus
  approved_by: string | null (FK)
  approved_at: timestamp | null
  
  created_at: timestamp
  updated_at: timestamp
}

BudgetLine {
  id: string (UUID)
  project_budget_id: string (FK)
  cost_code_id: string (FK) *required
  work_package_id: string | null (FK)
  
  // Budget Amounts
  budgeted_amount: decimal(15,2) *required
  committed_amount: decimal(15,2) (default: 0)
  actual_amount: decimal(15,2) (default: 0)
  
  // Calculated Fields
  available_amount: decimal(15,2) (budgeted - committed - actual)
  variance: decimal(15,2) (budgeted - actual)
  variance_percentage: decimal(5,2)
  
  // Thresholds
  warning_threshold: decimal(5,2) (e.g., 90%)
  
  created_at: timestamp
  updated_at: timestamp
}

ChangeOrder {
  id: string (UUID)
  change_order_number: string (auto: CO-2026-0001)
  project_id: string (FK)
  
  // Change Details
  description: string *required
  reason: string
  amount: decimal(15,2) *required
  impact_type: 'INCREASE' | 'DECREASE'
  
  // Approval
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  requested_by: string (FK)
  approved_by: string | null (FK)
  approved_at: timestamp | null
  
  // Budget Impact
  affected_cost_codes: string[] (array of cost code IDs)
  
  created_at: timestamp
  updated_at: timestamp
}

enum BudgetStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  REVISED = 'REVISED',
  CLOSED = 'CLOSED'
}
```

## STEP 7 — PURCHASE ORDER SYSTEM

### Database Schema

```typescript
PurchaseOrder {
  id: string (UUID)
  po_number: string (auto: PO-2026-0001)
  project_id: string (FK) *required
  vendor_id: string (FK) *required
  
  // PO Details
  description: string *required
  po_date: date *required
  expected_delivery_date: date | null
  
  // Financial
  subtotal: decimal(15,2)
  tax_amount: decimal(15,2)
  total_amount: decimal(15,2) *required
  
  // Tracking
  invoiced_amount: decimal(15,2) (default: 0)
  paid_amount: decimal(15,2) (default: 0)
  remaining_amount: decimal(15,2) (total - invoiced)
  
  // Status
  status: POStatus
  approved_by: string | null (FK)
  approved_at: timestamp | null
  
  // Terms
  payment_terms: string
  delivery_terms: string
  
  // Attachments
  attachment_ids: string[]
  
  created_at: timestamp
  updated_at: timestamp
}

PurchaseOrderLine {
  id: string (UUID)
  purchase_order_id: string (FK)
  cost_code_id: string (FK) *required
  work_package_id: string | null (FK)
  
  // Line Details
  description: string *required
  quantity: decimal(10,2) *required
  unit: string
  unit_price: decimal(15,2) *required
  line_total: decimal(15,2) (quantity * unit_price)
  
  // Tracking
  received_quantity: decimal(10,2) (default: 0)
  invoiced_quantity: decimal(10,2) (default: 0)
  invoiced_amount: decimal(15,2) (default: 0)
  
  created_at: timestamp
  updated_at: timestamp
}

enum POStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}
```

## STEP 8 — CSV IMPORT SYSTEM

### Import Templates

```typescript
CostEntryImport {
  project_code: string *required
  work_package_code: string
  cost_code: string *required
  cost_category: string *required
  vendor_name: string
  description: string *required
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number *required
  entry_date: string (YYYY-MM-DD) *required
  invoice_number: string
  is_billable: boolean
}

BudgetImport {
  project_code: string *required
  cost_code: string *required
  work_package_code: string
  budgeted_amount: number *required
}

ResourceRateImport {
  user_email: string *required
  role: string *required
  hourly_rate: number *required
  overtime_rate: number
  effective_from: string (YYYY-MM-DD) *required
  effective_to: string (YYYY-MM-DD)
}
```

### Import Service

```typescript
class ImportService {
  async importCostEntries(file: File, projectId: string): Promise<ImportResult>
  async importBudget(file: File, projectId: string): Promise<ImportResult>
  async importResourceRates(file: File): Promise<ImportResult>
  async validateImport(file: File, type: ImportType): Promise<ValidationResult>
  async downloadTemplate(type: ImportType): Promise<File>
}

interface ImportResult {
  success: boolean
  total_rows: number
  imported_rows: number
  failed_rows: number
  errors: ImportError[]
}

interface ImportError {
  row_number: number
  field: string
  error_message: string
  row_data: any
}
```

## IMPLEMENTATION PHASES

### Phase 1: Cost Codes (Week 1)
- [ ] Create CostCode entity and migration
- [ ] Seed standard cost code structure
- [ ] Cost code CRUD APIs
- [ ] Cost code hierarchy support
- [ ] Cost code management UI

### Phase 2: Vendors (Week 1)
- [ ] Create Vendor entity and migration
- [ ] Vendor CRUD APIs
- [ ] Vendor management UI
- [ ] Vendor search and filtering

### Phase 3: Resource Rates (Week 2)
- [ ] Create ResourceRate entity and migration
- [ ] Extend TimeEntry entity
- [ ] Resource rate CRUD APIs
- [ ] Auto-calculate labor cost from time entries
- [ ] Resource rate management UI

### Phase 4: Cost Entry System (Week 2-3)
- [ ] Create CostEntry entity and migration
- [ ] Cost entry CRUD APIs
- [ ] Structured cost entry modal UI
- [ ] Cost entry validation
- [ ] Cost entry approval workflow
- [ ] Cost entry list/grid view
- [ ] Cost entry filtering and search

### Phase 5: Budget System (Week 3-4)
- [ ] Create ProjectBudget entities and migration
- [ ] Create ChangeOrder entity and migration
- [ ] Budget CRUD APIs
- [ ] Budget setup UI
- [ ] Budget vs Actual tracking
- [ ] Change order management
- [ ] Budget variance alerts

### Phase 6: Purchase Orders (Week 4-5)
- [ ] Create PurchaseOrder entities and migration
- [ ] PO CRUD APIs
- [ ] PO creation UI
- [ ] PO approval workflow
- [ ] PO tracking (invoiced vs committed)
- [ ] Link cost entries to POs

### Phase 7: CSV Import (Week 5-6)
- [ ] Import service implementation
- [ ] CSV validation logic
- [ ] Import UI with drag-drop
- [ ] Template download
- [ ] Import error handling
- [ ] Import history tracking

### Phase 8: Document Linking (Week 6)
- [ ] Extend attachment system
- [ ] Link attachments to cost entries
- [ ] Link attachments to POs
- [ ] Document viewer
- [ ] Document management UI

### Phase 9: Integration & Testing (Week 7)
- [ ] Time-to-cost automation testing
- [ ] Budget control testing
- [ ] PO workflow testing
- [ ] Import testing
- [ ] End-to-end cost tracking flow
- [ ] Performance optimization

## UI COMPONENTS NEEDED

### 1. Cost Entry Modal
```typescript
<CostEntryModal
  isOpen={boolean}
  onClose={() => void}
  onSubmit={(data: CostEntryDTO) => Promise<void>}
  projectId={string}
  initialData={CostEntry | null}
/>
```

**Fields:**
- Project (dropdown, pre-selected)
- Work Package (dropdown, optional)
- Cost Code (hierarchical dropdown) *required
- Cost Category (dropdown) *required
- Vendor (searchable dropdown, optional)
- Description (textarea) *required
- Quantity (number)
- Unit (text)
- Unit Cost (currency)
- Total Cost (currency, auto-calculated) *required
- Entry Date (date picker) *required
- Invoice Number (text)
- Is Billable (checkbox)
- Attachments (file upload)

### 2. Budget Setup Page
```typescript
<BudgetSetupPage projectId={string} />
```

**Features:**
- Total budget input
- Contingency percentage
- Budget breakdown by cost code
- Budget allocation table
- Import budget from CSV
- Save/Submit for approval

### 3. Resource Rate Management
```typescript
<ResourceRateManagement />
```

**Features:**
- List all resources with rates
- Add/Edit rate
- Rate history
- Bulk rate update
- Import rates from CSV

### 4. Purchase Order Form
```typescript
<PurchaseOrderForm
  isOpen={boolean}
  onClose={() => void}
  onSubmit={(data: PODTO) => Promise<void>}
  projectId={string}
/>
```

**Features:**
- Vendor selection
- Multiple line items
- Cost code per line
- Approval workflow
- Document attachment
- PO preview/print

### 5. CSV Import Modal
```typescript
<CSVImportModal
  isOpen={boolean}
  onClose={() => void}
  importType={'cost' | 'budget' | 'rates'}
  projectId={string | null}
/>
```

**Features:**
- Drag-drop file upload
- Template download
- Validation preview
- Error display
- Import progress
- Success/failure summary

### 6. Cost Entry Grid
```typescript
<CostEntryGrid
  projectId={string | null}
  filters={CostEntryFilters}
/>
```

**Features:**
- Sortable columns
- Filterable (date range, cost code, category, vendor)
- Pagination
- Bulk actions (approve, delete)
- Export to CSV
- Quick edit

## API ENDPOINTS

### Cost Codes
```
GET    /api/cost-codes
GET    /api/cost-codes/:id
POST   /api/cost-codes
PUT    /api/cost-codes/:id
DELETE /api/cost-codes/:id
GET    /api/cost-codes/hierarchy
```

### Vendors
```
GET    /api/vendors
GET    /api/vendors/:id
POST   /api/vendors
PUT    /api/vendors/:id
DELETE /api/vendors/:id
GET    /api/vendors/search?q=
```

### Cost Entries
```
GET    /api/cost-entries
GET    /api/cost-entries/:id
POST   /api/cost-entries
PUT    /api/cost-entries/:id
DELETE /api/cost-entries/:id
POST   /api/cost-entries/:id/approve
GET    /api/projects/:projectId/cost-entries
```

### Resource Rates
```
GET    /api/resource-rates
GET    /api/resource-rates/:id
POST   /api/resource-rates
PUT    /api/resource-rates/:id
DELETE /api/resource-rates/:id
GET    /api/users/:userId/rates
GET    /api/users/:userId/current-rate
```

### Budgets
```
GET    /api/projects/:projectId/budget
POST   /api/projects/:projectId/budget
PUT    /api/projects/:projectId/budget/:id
GET    /api/projects/:projectId/budget/variance
POST   /api/projects/:projectId/change-orders
GET    /api/projects/:projectId/change-orders
PUT    /api/change-orders/:id/approve
```

### Purchase Orders
```
GET    /api/purchase-orders
GET    /api/purchase-orders/:id
POST   /api/purchase-orders
PUT    /api/purchase-orders/:id
DELETE /api/purchase-orders/:id
POST   /api/purchase-orders/:id/approve
POST   /api/purchase-orders/:id/receive
GET    /api/projects/:projectId/purchase-orders
```

### Import
```
POST   /api/import/cost-entries
POST   /api/import/budget
POST   /api/import/resource-rates
POST   /api/import/validate
GET    /api/import/template/:type
GET    /api/import/history
```

## SUCCESS CRITERIA

✅ All cost entries are properly categorized with cost codes
✅ Time entries automatically generate labor cost entries
✅ Budget can be set up and tracked per cost code
✅ Purchase orders track committed vs actual costs
✅ CSV import works for bulk data entry
✅ All cost entries can have invoice attachments
✅ Budget variance is calculated automatically
✅ Cost tracking is audit-proof with full trail
✅ Real construction teams can use the system

---

**This creates a professional, structured cost entry system that feeds accurate data into the financial engine.**
