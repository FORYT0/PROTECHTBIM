# Time & Cost Tracking - Data Flow Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Time Tracking   │  │  Cost Tracking   │  │  Project Detail  │ │
│  │      Page        │  │      Page        │  │      Page        │ │
│  │                  │  │                  │  │                  │ │
│  │  - Daily View    │  │  - Cost Entry    │  │  - Time & Cost   │ │
│  │  - Weekly View   │  │  - Cost Report   │  │    Analytics     │ │
│  │  - Entry Form    │  │  - Type Filter   │  │  - Summary Cards │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                      │            │
└───────────┼─────────────────────┼──────────────────────┼────────────┘
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINTS LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST   /api/v1/time_entries          ← Create time entry           │
│  GET    /api/v1/time_entries          ← List time entries           │
│  PATCH  /api/v1/time_entries/:id      ← Update time entry           │
│  DELETE /api/v1/time_entries/:id      ← Delete time entry           │
│  POST   /api/v1/time_entries/bulk     ← Bulk create entries         │
│                                                                       │
│  POST   /api/v1/cost_entries          ← Create cost entry           │
│  GET    /api/v1/cost_entries          ← List cost entries           │
│  PATCH  /api/v1/cost_entries/:id      ← Update cost entry           │
│  DELETE /api/v1/cost_entries/:id      ← Delete cost entry           │
│  POST   /api/v1/cost_entries/bulk     ← Bulk create entries         │
│                                                                       │
│  GET    /api/v1/projects/:id/analytics/time    ← Time analytics     │
│  GET    /api/v1/projects/:id/analytics/cost    ← Cost analytics     │
│  GET    /api/v1/projects/:id/analytics/summary ← Combined summary   │
│                                                                       │
└───────────┬─────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  TimeEntryRepository                                          │  │
│  │  - create()      - findAll()      - getTotalHoursByUser()    │  │
│  │  - update()      - findById()     - getTotalHoursByWP()      │  │
│  │  - delete()                                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  CostEntryRepository                                          │  │
│  │  - create()      - findAll()      - getTotalCostByWP()       │  │
│  │  - update()      - findById()     - getCostBreakdownByType() │  │
│  │  - delete()                                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ProjectAnalyticsRouter                                       │  │
│  │  - Aggregates data from all work packages                     │  │
│  │  - Groups by: work package, user, type, date                  │  │
│  │  - Calculates: totals, averages, billable percentages         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────┬─────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  time_entries table                                           │  │
│  │  ┌────────────┬──────────────┬────────┬──────┬──────────┐   │  │
│  │  │ id (UUID)  │ work_pkg_id  │ user_id│ hours│ date     │   │  │
│  │  ├────────────┼──────────────┼────────┼──────┼──────────┤   │  │
│  │  │ abc-123    │ wp-001       │ u-001  │ 8.0  │ 2026-... │   │  │
│  │  │ abc-124    │ wp-002       │ u-001  │ 4.5  │ 2026-... │   │  │
│  │  │ abc-125    │ wp-001       │ u-002  │ 6.0  │ 2026-... │   │  │
│  │  └────────────┴──────────────┴────────┴──────┴──────────┘   │  │
│  │  + comment, billable, created_at, updated_at                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  cost_entries table                                           │  │
│  │  ┌────────────┬──────────────┬────────┬────────┬──────────┐ │  │
│  │  │ id (UUID)  │ work_pkg_id  │ type   │ amount │ date     │ │  │
│  │  ├────────────┼──────────────┼────────┼────────┼──────────┤ │  │
│  │  │ cost-001   │ wp-001       │ labor  │ 5000.00│ 2026-... │ │  │
│  │  │ cost-002   │ wp-001       │material│ 3500.00│ 2026-... │ │  │
│  │  │ cost-003   │ wp-002       │equip   │ 1200.00│ 2026-... │ │  │
│  │  └────────────┴──────────────┴────────┴────────┴──────────┘ │  │
│  │  + description, reference, billable, currency, user_id       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  work_packages table                                          │  │
│  │  - Links time/cost entries to projects                        │  │
│  │  - Contains: project_id, subject, estimated_hours, budget     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Entry Flow

### 1. Time Entry Creation

```
User fills form → Frontend validates → API receives request
                                              ↓
                                    Creates TimeEntry entity
                                              ↓
                                    Saves to time_entries table
                                              ↓
                                    Logs activity to activity_log
                                              ↓
                                    Returns created entry to frontend
                                              ↓
                                    Frontend updates UI
                                              ↓
                                    WebSocket notifies other users
```

**Example Request**:
```json
POST /api/v1/time_entries
{
  "work_package_id": "wp-001",
  "hours": 8.5,
  "date": "2026-02-23",
  "comment": "Completed foundation inspection",
  "billable": true
}
```

**Example Response**:
```json
{
  "time_entry": {
    "id": "te-abc-123",
    "work_package_id": "wp-001",
    "user_id": "u-001",
    "hours": 8.5,
    "date": "2026-02-23",
    "comment": "Completed foundation inspection",
    "billable": true,
    "created_at": "2026-02-23T10:30:00Z",
    "updated_at": "2026-02-23T10:30:00Z"
  }
}
```

---

### 2. Cost Entry Creation

```
User fills form → Frontend validates → API receives request
                                              ↓
                                    Creates CostEntry entity
                                              ↓
                                    Saves to cost_entries table
                                              ↓
                                    Logs activity to activity_log
                                              ↓
                                    Returns created entry to frontend
                                              ↓
                                    Frontend updates UI
                                              ↓
                                    WebSocket notifies other users
```

**Example Request**:
```json
POST /api/v1/cost_entries
{
  "work_package_id": "wp-001",
  "type": "material",
  "amount": 5000.00,
  "currency": "USD",
  "date": "2026-02-23",
  "description": "Concrete delivery for foundation",
  "reference": "INV-2024-001",
  "billable": true
}
```

---

### 3. Analytics Calculation Flow

```
User opens analytics page → Frontend requests analytics
                                        ↓
                            API receives request with project_id
                                        ↓
                            Fetches all work packages for project
                                        ↓
                            Queries time_entries for all work packages
                                        ↓
                            Queries cost_entries for all work packages
                                        ↓
                            Aggregates data:
                            - Sum total hours/costs
                            - Group by work package
                            - Group by user
                            - Group by type
                            - Group by date
                            - Calculate billable percentages
                                        ↓
                            Returns calculated analytics
                                        ↓
                            Frontend renders charts and tables
```

**Example Analytics Request**:
```
GET /api/v1/projects/proj-001/analytics/time?date_from=2026-02-01&date_to=2026-02-28&group_by=date
```

**Example Analytics Response**:
```json
{
  "project_id": "proj-001",
  "total_hours": 320.5,
  "billable_hours": 280.0,
  "non_billable_hours": 40.5,
  "by_work_package": [
    {
      "work_package_id": "wp-001",
      "work_package_subject": "Foundation Work",
      "hours": 120.0,
      "entry_count": 15
    },
    {
      "work_package_id": "wp-002",
      "work_package_subject": "Framing",
      "hours": 200.5,
      "entry_count": 25
    }
  ],
  "by_user": [
    {
      "userId": "u-001",
      "userName": "John Doe",
      "hours": 160.0,
      "entryCount": 20
    },
    {
      "userId": "u-002",
      "userName": "Jane Smith",
      "hours": 160.5,
      "entryCount": 20
    }
  ],
  "by_date": [
    { "date": "2026-02-01", "hours": 16.0 },
    { "date": "2026-02-02", "hours": 18.5 },
    ...
  ]
}
```

---

## Real-Time Updates

### WebSocket Notification Flow

```
User A logs time → API saves entry → Activity log created
                                            ↓
                                WebSocket server notified
                                            ↓
                        Broadcasts to all users in project room
                                            ↓
                        User B's browser receives notification
                                            ↓
                        User B's UI updates automatically
```

---

## Data Relationships

```
┌─────────────┐
│   Project   │
└──────┬──────┘
       │ has many
       ▼
┌─────────────────┐
│  Work Packages  │
└──────┬──────────┘
       │ has many
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Time Entries │   │ Cost Entries │   │ Activity Log │
└──────────────┘   └──────────────┘   └──────────────┘
       │                  │
       │ belongs to       │ belongs to
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│     User     │   │  Cost Types  │
└──────────────┘   │  - Labor     │
                   │  - Material  │
                   │  - Equipment │
                   │  - Subcon    │
                   │  - Other     │
                   └──────────────┘
```

---

## Calculation Examples

### Total Project Hours
```sql
SELECT SUM(hours) as total_hours
FROM time_entries te
JOIN work_packages wp ON te.work_package_id = wp.id
WHERE wp.project_id = 'proj-001'
```

### Billable Hours Percentage
```
billable_percentage = (billable_hours / total_hours) * 100
```

### Cost by Type
```sql
SELECT type, SUM(amount) as total_amount
FROM cost_entries ce
JOIN work_packages wp ON ce.work_package_id = wp.id
WHERE wp.project_id = 'proj-001'
GROUP BY type
```

### Average Hours per Work Package
```
avg_hours = total_hours / work_package_count
```

---

## Performance Optimizations

1. **Database Indexes**:
   - `time_entries(work_package_id, date)`
   - `cost_entries(work_package_id, date)`
   - `work_packages(project_id)`

2. **Caching**:
   - Redis cache for frequently accessed analytics
   - Cache invalidation on new entries

3. **Pagination**:
   - Time/cost entry lists paginated (20 per page)
   - Analytics limited to date ranges

4. **Aggregation**:
   - Database-level aggregation for better performance
   - Batch processing for bulk operations

---

## Security & Permissions

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only:
   - Create entries for work packages they have access to
   - Edit/delete their own entries
   - View analytics for projects they're assigned to
3. **Validation**: All inputs validated before database operations
4. **Audit Trail**: All changes logged in activity_log table

---

**Last Updated**: February 23, 2026
