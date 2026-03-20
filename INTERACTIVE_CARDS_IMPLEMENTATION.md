# Interactive Cards Implementation Guide

## Quick Implementation Reference

This guide shows exactly how to make every card interactive across all three command center pages.

## 1. PROJECT COMMAND CENTER (ProjectDetailPage.tsx)

### KPI Row Cards - Add onClick/to props

```tsx
// Tasks Card → Work Packages
<InteractiveCard
  icon={Package}
  iconColor="text-blue-400"
  title="Total Tasks"
  value={mockKPIs.tasks.total}
  subtitle={`${mockKPIs.tasks.overdue} overdue`}
  trend={{ value: "+12%", direction: "up", color: "text-green-400" }}
  to="/work-packages"
/>

// Budget Card → Cost Tracking
<InteractiveCard
  icon={DollarSign}
  iconColor="text-green-400"
  title="Budget"
  value={formatCurrency(mockKPIs.budget.total)}
  subtitle={`${formatCurrency(mockKPIs.budget.used)} used`}
  badge={{ text: "86%", color: "text-yellow-400" }}
  to="/cost-tracking"
/>

// RFIs Card → Issues (filtered)
<InteractiveCard
  icon={FileText}
  iconColor="text-purple-400"
  title="Open RFIs"
  value={mockKPIs.rfis}
  subtitle="Awaiting response"
  to="/issues?type=rfi"
/>

// Issues Card → Issues
<InteractiveCard
  icon={AlertTriangle}
  iconColor="text-red-400"
  title="Active Issues"
  value={mockKPIs.issues.total}
  subtitle="Needs attention"
  badge={{ text: `${mockKPIs.issues.critical} critical`, color: "text-red-400" }}
  to="/issues"
/>

// Team Card → Resources
<InteractiveCard
  icon={Users}
  iconColor="text-cyan-400"
  title="Team Members"
  value={mockKPIs.team}
  subtitle="Active contributors"
  badge={{ text: "8 online", color: "text-green-400" }}
  to="/resources"
/>

// Completion Card → Gantt
<InteractiveCard
  icon={Zap}
  iconColor="text-yellow-400"
  title="Completion"
  value={`${mockKPIs.completion}%`}
  subtitle="+3% this week"
  trend={{ value: "+3%", direction: "up", color: "text-green-400" }}
  to={`/projects/${id}/gantt`}
/>
```

### Section Cards - Make clickable

```tsx
// Financial Summary Card
<div 
  onClick={() => navigate('/cost-tracking')}
  className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
>
  {/* existing content */}
</div>

// BIM Model Status Card
<div 
  onClick={() => navigate('/bim-model')}
  className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 p-6 cursor-pointer hover:border-blue-500/50 hover:scale-[1.01] transition-all duration-200"
>
  {/* existing content */}
</div>

// Team Members Card
<div 
  onClick={() => navigate('/resources')}
  className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
>
  {/* existing content */}
</div>

// Documents Card
<div 
  onClick={() => navigate('/documents')}
  className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
>
  {/* existing content */}
</div>
```

## 2. COST CONTROL DASHBOARD (CostTrackingPage.tsx)

### KPI Row Cards

```tsx
// Total Cost Card → Expand inline or navigate
<InteractiveCard
  icon={DollarSign}
  iconColor="text-green-400"
  title="Total Cost"
  value={formatCurrency(mockFinancials.totalCost)}
  trend={{ value: "+12%", direction: "up", color: "text-green-400" }}
  progress={{ value: 75, color: "bg-green-400" }}
  onClick={() => setShowCostLedger(true)} // Slide-over panel
/>

// Billable Card → Filter view
<InteractiveCard
  icon={CheckCircle}
  iconColor="text-blue-400"
  title="Billable"
  value={formatCurrency(mockFinancials.billableCost)}
  subtitle="80% of total"
  badge={{ text: "80%", color: "text-blue-400" }}
  onClick={() => {
    setFilterType('billable');
    scrollToLedger();
  }}
/>

// Non-Billable Card → Filter view
<InteractiveCard
  icon={AlertTriangle}
  iconColor="text-orange-400"
  title="Non-Billable"
  value={formatCurrency(mockFinancials.nonBillableCost)}
  subtitle="Monitor closely"
  badge={{ text: "20%", color: "text-orange-400" }}
  onClick={() => {
    setFilterType('non-billable');
    scrollToLedger();
  }}
/>

// Cost Entries Card → Detailed list
<InteractiveCard
  icon={BarChart3}
  iconColor="text-purple-400"
  title="Cost Entries"
  value={mockFinancials.costEntries}
  subtitle="This period"
  trend={{ value: `+${mockFinancials.entriesTrend}%`, direction: "up", color: "text-green-400" }}
  to="/cost-tracking/entries"
/>

// Budget Remaining Card → Modal
<InteractiveCard
  icon={Target}
  iconColor="text-cyan-400"
  title="Budget Remaining"
  value={formatCurrency(mockFinancials.budgetRemaining)}
  badge={{ text: "13.3%", color: "text-cyan-400" }}
  progress={{ value: 13, color: "bg-cyan-400" }}
  onClick={() => setShowBudgetModal(true)}
/>

// Cost Variance Card → Variance analysis
<InteractiveCard
  icon={TrendingDown}
  iconColor="text-red-400"
  title="Cost Variance"
  value={`${mockFinancials.variance}%`}
  subtitle="Over budget"
  to="/cost-tracking/variance"
/>
```

### Chart Interactions

```tsx
// Cost by Type Donut Chart
<div className="cursor-pointer" onClick={(e) => {
  const segment = e.target.dataset.category;
  if (segment) {
    setFilterCategory(segment);
    scrollToLedger();
  }
}}>
  {/* Chart segments with data-category attributes */}
</div>

// Budget Control Table Rows
<tr 
  onClick={() => handleCategoryClick(item.type)}
  className="border-b border-gray-800 hover:bg-[#111111] transition-colors cursor-pointer"
>
  {/* table cells */}
</tr>
```

### Section Cards

```tsx
// Forecast Card
<div 
  onClick={() => navigate('/cost-tracking/forecast')}
  className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 hover:scale-[1.01] transition-all duration-200"
>
  {/* forecast content */}
</div>

// Variance Alerts Card
<div 
  onClick={() => setExpandedAlerts(!expandedAlerts)}
  className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-6 cursor-pointer hover:bg-[#111111] hover:border-gray-700 transition-all duration-200"
>
  {/* alerts content */}
</div>
```

## 3. TIME INTELLIGENCE DASHBOARD (TimeTrackingPage.tsx)

### KPI Row Cards

```tsx
// Total Hours Card → Weekly summary
<InteractiveCard
  icon={Clock}
  iconColor="text-blue-400"
  title="Total Hours"
  value={formatHours(mockLaborMetrics.totalHours)}
  subtitle="This week"
  trend={{ value: "+8%", direction: "up", color: "text-green-400" }}
  to="/time-tracking/summary"
/>

// Billable Hours Card → Billable breakdown
<InteractiveCard
  icon={CheckCircle}
  iconColor="text-green-400"
  title="Billable Hours"
  value={formatHours(mockLaborMetrics.billableHours)}
  badge={{ text: "74%", color: "text-green-400" }}
  progress={{ value: 74, color: "bg-green-400" }}
  onClick={() => {
    setFilterType('billable');
    scrollToTimesheet();
  }}
/>

// Non-Billable Card → Non-billable analysis
<InteractiveCard
  icon={AlertCircle}
  iconColor="text-yellow-400"
  title="Non-Billable"
  value={formatHours(mockLaborMetrics.nonBillableHours)}
  subtitle="Review allocation"
  badge={{ text: "26%", color: "text-yellow-400" }}
  onClick={() => {
    setFilterType('non-billable');
    scrollToTimesheet();
  }}
/>

// Overtime Card → Overtime analytics
<InteractiveCard
  icon={AlertCircle}
  iconColor="text-orange-400"
  title="Overtime"
  value={formatHours(mockLaborMetrics.overtimeHours)}
  subtitle="Above threshold"
  trend={{ value: "+2%", direction: "up", color: "text-orange-400" }}
  to="/time-tracking/overtime"
/>

// Active Workers Card → Team utilization
<InteractiveCard
  icon={Users}
  iconColor="text-cyan-400"
  title="Active Workers"
  value={mockLaborMetrics.activeWorkers}
  subtitle="This period"
  badge={{ text: "10 online", color: "text-green-400" }}
  to="/resources"
/>

// Avg Daily Hours Card → Performance dashboard
<InteractiveCard
  icon={Activity}
  iconColor="text-purple-400"
  title="Avg Daily Hours"
  value={formatHours(mockLaborMetrics.avgDailyHours)}
  subtitle="Consistent"
  trend={{ value: "Stable", direction: "neutral", color: "text-green-400" }}
  onClick={() => setShowPerformanceModal(true)}
/>
```

### Work Package Interactions

```tsx
// Work Package Breakdown Rows
<div 
  onClick={() => handleWorkPackageClick(item)}
  className="flex items-center gap-3 cursor-pointer hover:bg-[#111111] rounded-lg p-2 transition-colors"
>
  {/* work package content */}
</div>
```

### Team Member Cards

```tsx
// Team Comparison Cards
<div 
  onClick={() => handleMemberClick(member)}
  className="p-3 bg-[#111111] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
>
  {/* member details */}
</div>
```

### Cost Integration Card

```tsx
// Labor Cost Generated Card
<div 
  onClick={() => navigate('/cost-tracking?filter=labor')}
  className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/30 p-6 cursor-pointer hover:border-green-500/50 hover:scale-[1.01] transition-all duration-200"
>
  {/* labor cost content */}
</div>
```

## Implementation Steps

### Step 1: Import InteractiveCard
```tsx
import { InteractiveCard } from '../components/InteractiveCard';
```

### Step 2: Add State for Modals/Panels
```tsx
const [showCostLedger, setShowCostLedger] = useState(false);
const [showBudgetModal, setShowBudgetModal] = useState(false);
const [selectedWorkPackage, setSelectedWorkPackage] = useState(null);
const [filterType, setFilterType] = useState<'all' | 'billable' | 'non-billable'>('all');
```

### Step 3: Replace Static Cards
Replace existing card divs with InteractiveCard components using the patterns above.

### Step 4: Add Slide-Over Panels
```tsx
{showCostLedger && (
  <SlideOverPanel
    isOpen={showCostLedger}
    onClose={() => setShowCostLedger(false)}
    title="Cost Ledger"
  >
    {/* Detailed cost breakdown */}
  </SlideOverPanel>
)}
```

### Step 5: Add Modals
```tsx
{showBudgetModal && (
  <Modal
    isOpen={showBudgetModal}
    onClose={() => setShowBudgetModal(false)}
    title="Budget Breakdown"
  >
    {/* Budget details */}
  </Modal>
)}
```

### Step 6: Add Keyboard Navigation
```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

### Step 7: Add Loading States
```tsx
{isLoading && (
  <div className="absolute inset-0 bg-[#0A0A0A]/80 flex items-center justify-center rounded-xl">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
  </div>
)}
```

### Step 8: Add Error Handling
```tsx
{error && (
  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
    <p className="text-sm text-red-400">{error}</p>
    <button onClick={handleRetry} className="text-xs text-red-400 underline mt-2">
      Try again
    </button>
  </div>
)}
```

## Testing Checklist

For each page, verify:
- [ ] All KPI cards are clickable
- [ ] Hover effects work (background change, border, scale)
- [ ] Click navigates to correct route
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus indicators are visible
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Modals/panels open and close properly
- [ ] Filters apply correctly
- [ ] Smooth transitions (200ms)
- [ ] Mobile touch interactions work
- [ ] No console errors

## Common Patterns

### Pattern 1: Navigate to Page
```tsx
to="/work-packages"
```

### Pattern 2: Filter Current View
```tsx
onClick={() => {
  setFilterType('billable');
  scrollToSection();
}}
```

### Pattern 3: Open Modal
```tsx
onClick={() => setModalOpen(true)}
```

### Pattern 4: Open Slide-Over
```tsx
onClick={() => {
  setSelectedItem(item);
  setSlideOverOpen(true);
}}
```

### Pattern 5: Expand Inline
```tsx
onClick={() => setExpanded(!expanded)}
```

---

**Implementation Priority:**
1. ProjectDetailPage (highest impact)
2. CostTrackingPage (financial critical)
3. TimeTrackingPage (workforce critical)

**Estimated Time:** 2-3 hours per page
**Testing Time:** 1 hour per page
**Total:** 9-12 hours for complete implementation
