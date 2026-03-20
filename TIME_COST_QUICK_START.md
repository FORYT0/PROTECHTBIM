# Time & Cost Tracking - Quick Start Guide

## 🎯 Where Users Input Data

### Time Entries (Hours Worked)

**3 Ways to Log Time:**

1. **Main Time Tracking Page** (Recommended for daily logging)
   - Navigate: Sidebar → **"Time Tracking"**
   - Click **"Add Time Entry"** button
   - Fill form and save

2. **From Work Package Detail**
   - Navigate: Projects → Select Project → Work Packages → Select Work Package
   - Scroll to "Time Entries" section
   - Click **"Log Time"**

3. **Bulk Entry** (For multiple entries at once)
   - Navigate: Sidebar → **"Time Tracking"** → **"Weekly View"**
   - Fill in multiple days at once

---

### Cost Entries (Expenses)

**2 Ways to Log Costs:**

1. **Main Cost Tracking Page** (Recommended)
   - Navigate: Sidebar → **"Cost Tracking"**
   - Click **"Add Cost Entry"** button
   - Select cost type (Labor, Material, Equipment, Subcontractor, Other)
   - Fill form and save

2. **From Work Package Detail**
   - Navigate: Projects → Select Project → Work Packages → Select Work Package
   - Scroll to "Cost Entries" section
   - Click **"Add Cost"**

---

## 📊 Where to View Analytics

### Project-Level Dashboard
- Navigate: Projects → Select Project → **"Time & Cost"** button
- Shows:
  - Total hours and costs
  - Breakdown by work package
  - Breakdown by team member
  - Breakdown by cost type
  - Billable vs non-billable

### Personal Time Tracking
- Navigate: Sidebar → **"Time Tracking"**
- View your own time entries
- Edit or delete entries

### Cost Reports
- Navigate: Sidebar → **"Cost Tracking"**
- View all cost entries
- Filter by type, date, project

---

## 🔄 How Data Flows

```
1. USER INPUTS DATA
   ↓
   Time Entry Form or Cost Entry Form
   ↓
2. DATA SAVED TO DATABASE
   ↓
   time_entries table or cost_entries table
   ↓
3. AUTOMATIC CALCULATIONS
   ↓
   System aggregates by project, work package, user, type
   ↓
4. DISPLAY IN DASHBOARDS
   ↓
   Analytics page shows totals, breakdowns, charts
```

---

## 📝 Required Fields

### Time Entry
- ✅ Work Package (which task)
- ✅ Hours (decimal format: 2.5 = 2 hours 30 min)
- ✅ Date (when work was done)
- ⭕ Comment (optional but recommended)
- ⭕ Billable checkbox (default: unchecked)

### Cost Entry
- ✅ Work Package (which task)
- ✅ Type (Labor, Material, Equipment, Subcontractor, Other)
- ✅ Amount (cost in dollars)
- ✅ Date (when cost was incurred)
- ⭕ Description (optional but recommended)
- ⭕ Reference (invoice/PO number)
- ⭕ Billable checkbox (default: unchecked)

---

## 🚀 Quick Example

### Scenario: Log 8 hours of work on foundation

1. Click **"Time Tracking"** in sidebar
2. Click **"Add Time Entry"**
3. Fill in:
   - Work Package: "Foundation Work"
   - Hours: 8
   - Date: Today (auto-filled)
   - Comment: "Poured concrete for north section"
   - Billable: ✓ (checked)
4. Click **"Save"**
5. Done! Entry is saved and appears in your timesheet

### Scenario: Log $5,000 material cost

1. Click **"Cost Tracking"** in sidebar
2. Click **"Add Cost Entry"**
3. Fill in:
   - Work Package: "Foundation Work"
   - Type: Material
   - Amount: 5000
   - Date: Today
   - Description: "Concrete delivery"
   - Reference: "INV-2024-001"
   - Billable: ✓ (checked)
4. Click **"Save"**
5. Done! Cost is logged and appears in reports

---

## 📈 View Your Impact

After logging data, immediately see results:

1. Go to **Projects** → Select your project
2. Click **"Time & Cost"** button
3. See your entries reflected in:
   - Total hours counter
   - Total cost counter
   - Your name in "Time by Team Member"
   - Work package breakdown

---

## 💡 Pro Tips

- **Log daily**: Don't wait until end of week
- **Be specific**: Add comments to help with billing
- **Mark billable**: Helps with invoicing clients
- **Use references**: Always add invoice numbers for costs
- **Check analytics**: Review weekly to stay on budget

---

## 🆘 Common Questions

**Q: Can I edit an entry after saving?**
A: Yes! Click on the entry in your timesheet and click "Edit"

**Q: Can I delete an entry?**
A: Yes! Click on the entry and click "Delete" (only your own entries)

**Q: How do I see all project costs?**
A: Go to Projects → Select Project → "Time & Cost" button

**Q: What if I don't see my work package?**
A: Contact your project manager to create the work package first

**Q: Can I log time for past dates?**
A: Yes! Just select the date in the form

---

## 🎓 Next Steps

1. ✅ Log your first time entry
2. ✅ Log your first cost entry
3. ✅ View project analytics
4. ✅ Review weekly totals
5. ✅ Share dashboard with team

---

**Need Help?** Check the full user guide: `USER_GUIDE_TIME_COST_TRACKING.md`

**Last Updated**: February 23, 2026
