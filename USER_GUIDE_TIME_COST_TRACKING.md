# Time & Cost Tracking User Guide

## Overview
The PROTECHT BIM platform provides comprehensive time and cost tracking features to help you monitor project performance, track team productivity, and manage budgets effectively.

---

## Where to Input Data

### 1. Time Entry (Logging Hours)

#### Option A: From the Main Navigation
1. Click **"Time Tracking"** in the left sidebar
2. Choose between **Daily View** or **Weekly View**
3. Click **"Add Time Entry"** button
4. Fill in the form:
   - **Work Package**: Select the task you worked on
   - **Hours**: Enter hours worked (e.g., 2.5 for 2 hours 30 minutes)
   - **Date**: Select the date (defaults to today)
   - **Comment**: Add notes about what you did (optional)
   - **Billable**: Check if this time should be billed to the client
5. Click **"Save"** to log your time

#### Option B: From a Specific Work Package
1. Navigate to **Projects** → Select a project → **Work Packages**
2. Click on a work package
3. In the work package detail view, find the **"Time Entries"** section
4. Click **"Log Time"** button
5. Fill in hours, date, and comments
6. Save the entry

#### Option C: Quick Entry from Project Detail
1. Go to **Projects** → Select a project
2. Click **"Time & Cost"** button
3. This shows all time entries for the project
4. Use the time tracking page to add new entries

---

### 2. Cost Entry (Logging Expenses)

#### Option A: From the Main Navigation
1. Click **"Cost Tracking"** in the left sidebar
2. Click **"Add Cost Entry"** button
3. Fill in the form:
   - **Work Package**: Select the task this cost relates to
   - **Cost Type**: Choose from:
     - **Labor**: Employee wages, contractor fees
     - **Material**: Construction materials, supplies
     - **Equipment**: Machinery rental, tools
     - **Subcontractor**: Third-party service costs
     - **Other**: Miscellaneous expenses
   - **Amount**: Enter the cost amount
   - **Currency**: Select currency (default: USD)
   - **Date**: When the cost was incurred
   - **Description**: What the cost was for
   - **Reference**: Invoice number, PO number, etc. (optional)
   - **Billable**: Check if this should be billed to the client
4. Click **"Save"** to log the cost

#### Option B: From a Specific Work Package
1. Navigate to **Projects** → Select a project → **Work Packages**
2. Click on a work package
3. In the work package detail view, find the **"Cost Entries"** section
4. Click **"Add Cost"** button
5. Fill in the cost details
6. Save the entry

---

## Viewing Analytics & Reports

### Project-Level Analytics
1. Go to **Projects** → Select a project
2. Click **"Time & Cost"** button in the project header
3. You'll see:
   - **Summary Cards**: Total hours, total cost, work package count, averages
   - **Date Range Filter**: Filter data by specific time periods
   - **Time Breakdown**: Hours by work package and team member
   - **Cost Breakdown**: Costs by type and work package
   - **Billable vs Non-Billable**: Visual comparison with progress bars

### Individual Time Tracking
1. Click **"Time Tracking"** in the sidebar
2. **Daily View**: See all your entries for a specific day
3. **Weekly View**: See your weekly totals and breakdown
4. Edit or delete entries as needed

### Cost Reports
1. Click **"Cost Tracking"** in the sidebar
2. View cost breakdown by type
3. See budget vs actual comparisons
4. Export reports for accounting

---

## Data Flow & Calculations

### How the System Works

```
User Input → Database → Analytics Engine → Dashboard Display
```

1. **Data Entry**:
   - Users log time entries (hours worked on tasks)
   - Users log cost entries (expenses for tasks)
   - All entries are linked to specific work packages

2. **Data Storage**:
   - Time entries stored in `time_entries` table
   - Cost entries stored in `cost_entries` table
   - Each entry references a work package and project

3. **Automatic Calculations**:
   - System aggregates all entries by project
   - Calculates totals, averages, and breakdowns
   - Groups data by work package, user, type, and date
   - Separates billable vs non-billable amounts

4. **Real-Time Updates**:
   - Analytics update immediately when new data is entered
   - WebSocket notifications keep dashboards in sync
   - Activity feed shows recent time/cost logs

---

## Example Workflow

### Scenario: Construction Project Manager

**Morning - Log Yesterday's Work**:
1. Open **Time Tracking** → **Daily View**
2. Select yesterday's date
3. Add entries for each task:
   - "Site inspection" - 2 hours - Billable
   - "Team meeting" - 1 hour - Non-billable
   - "Blueprint review" - 3 hours - Billable

**Midday - Record Material Costs**:
1. Open **Cost Tracking**
2. Add cost entry:
   - Work Package: "Foundation Work"
   - Type: Material
   - Amount: $5,000
   - Description: "Concrete delivery"
   - Reference: "INV-2024-001"
   - Billable: Yes

**Afternoon - Check Project Status**:
1. Go to **Projects** → Select "Building A"
2. Click **"Time & Cost"** button
3. Review:
   - Total hours logged this week
   - Total costs by type
   - Which work packages are over/under budget
   - Team member productivity

**End of Week - Generate Report**:
1. Open **Projects** → "Building A" → **"Time & Cost"**
2. Set date range to "This Week"
3. Review all metrics
4. Share dashboard with stakeholders

---

## Tips for Effective Tracking

### Time Entry Best Practices
- ✅ Log time daily while it's fresh in your mind
- ✅ Be specific in comments (helps with billing and reporting)
- ✅ Mark billable hours correctly for accurate invoicing
- ✅ Use consistent work package names
- ✅ Round to nearest 0.25 hours (15-minute increments)

### Cost Entry Best Practices
- ✅ Always include reference numbers (invoices, POs)
- ✅ Choose the correct cost type for accurate reporting
- ✅ Add detailed descriptions for audit trails
- ✅ Log costs on the date they were incurred
- ✅ Attach receipts/invoices using the attachments feature

### Analytics Best Practices
- ✅ Review project analytics weekly
- ✅ Compare actual vs estimated hours/costs
- ✅ Identify cost overruns early
- ✅ Track billable percentage to maximize revenue
- ✅ Use date filters to analyze specific periods

---

## Quick Reference

### Time Entry Fields
| Field | Required | Description |
|-------|----------|-------------|
| Work Package | Yes | Task you worked on |
| Hours | Yes | Time spent (decimal format) |
| Date | Yes | When work was performed |
| Comment | No | What you did |
| Billable | No | Should client be charged? |

### Cost Entry Fields
| Field | Required | Description |
|-------|----------|-------------|
| Work Package | Yes | Task this cost relates to |
| Type | Yes | Labor, Material, Equipment, Subcontractor, Other |
| Amount | Yes | Cost in selected currency |
| Currency | Yes | USD, EUR, GBP, etc. |
| Date | Yes | When cost was incurred |
| Description | No | What the cost was for |
| Reference | No | Invoice/PO number |
| Billable | No | Should client be charged? |

---

## Keyboard Shortcuts

- **Ctrl + T**: Open Time Tracking
- **Ctrl + C**: Open Cost Tracking
- **Ctrl + N**: New Time Entry (when on Time Tracking page)
- **Ctrl + S**: Save current entry
- **Esc**: Close entry form

---

## Troubleshooting

### "Work package not found"
- Ensure the work package exists in the project
- Check that you have permission to log time/costs to it

### "Failed to save entry"
- Check your internet connection
- Verify all required fields are filled
- Ensure date is valid
- Try refreshing the page

### "Analytics not updating"
- Refresh the page (F5)
- Check that entries were saved successfully
- Verify date range filter settings

---

## Support

For additional help:
- Check the in-app help tooltips (hover over ? icons)
- Contact your project administrator
- Review the API documentation for integration options

---

**Last Updated**: February 23, 2026
**Version**: 1.0
