# Interactive Card System - Construction Intelligence Command System

## Overview
This document defines the complete interactive card system that transforms PROTECHT BIM from a static dashboard into a **Card-Driven Interactive Control System**.

## Core Principle
**Every card is a gateway to intelligence.**

Cards are NOT static summaries. Cards are:
- Navigation nodes
- Control portals  
- Data expansion triggers
- Intelligence gateways

## Design System

### Material Pure Black Theme
```css
Primary Background: #000000
Surface: #0C0C0C
Card: #111111
Border: 1px solid #1E1E1E

Text:
  Primary: #FFFFFF
  Secondary: #9CA3AF
  Muted: #6B7280

Accent Colors:
  Blue: #2F80ED
  Green: #27AE60
  Orange: #F2994A
  Red: #EB5757
  Yellow: #F2C94C
  Purple: #9B51E0
  Cyan: #56CCF2
```

### Card Interaction States

#### Default State
```css
background: #0A0A0A
border: 1px solid #1A1A1A (gray-800)
transition: all 200ms ease
```

#### Hover State
```css
background: #111111 (slight brightness increase)
border: 1px solid #2A2A2A (gray-700)
transform: scale(1.02)
box-shadow: 0 4px 12px rgba(47, 128, 237, 0.1)
cursor: pointer
```

#### Focus State (Keyboard Navigation)
```css
outline: 2px solid #2F80ED
outline-offset: 2px
```

#### Active/Click State
```css
transform: scale(0.98)
transition: transform 100ms
```

## Card Navigation Logic

### PROJECT COMMAND CENTER

#### KPI Cards
| Card | Route | Description |
|------|-------|-------------|
| **Tasks** | `/work-packages` | Opens work package control center |
| **Budget** | `/cost-tracking` | Opens financial control dashboard |
| **RFIs** | `/issues?type=rfi` | Filters issues to RFI type |
| **Issues** | `/issues` | Opens issue tracker |
| **Team** | `/resources` | Opens resource management |
| **Completion** | `/projects/{id}/gantt` | Opens Gantt chart view |

#### Section Cards
| Card | Action | Description |
|------|--------|-------------|
| **BIM Status** | `/bim-model` | Opens BIM viewer interface |
| **Risk Card** | `/risk-register` | Opens risk management |
| **Documents** | `/documents` | Opens document library |
| **Financial Summary** | `/cost-tracking` | Opens cost dashboard |
| **Team Members** | `/resources` | Opens team management |

#### Activity Entries
- Click on activity → Opens detail drawer
- Slide-in panel from right
- Shows full activity context
- Quick actions available

### COST CONTROL DASHBOARD

#### KPI Cards
| Card | Route/Action | Description |
|------|--------------|-------------|
| **Total Cost** | Expand inline | Shows cost ledger breakdown |
| **Billable** | Filter view | Filters to billable costs only |
| **Non-Billable** | Filter view | Filters to non-billable costs |
| **Cost Entries** | `/cost-tracking/entries` | Opens detailed entry list |
| **Budget Remaining** | Modal | Shows budget breakdown table |
| **Cost Variance** | `/cost-tracking/variance` | Opens variance analysis |

#### Chart Interactions
| Element | Action | Description |
|---------|--------|-------------|
| **Cost by Type (Donut)** | Click segment | Filters ledger by category |
| **Cost Over Time** | Click data point | Shows period details |
| **Budget Control Row** | Click row | Opens category deep dive |

#### Section Cards
| Card | Action | Description |
|------|--------|-------------|
| **Forecast Card** | `/cost-tracking/forecast` | Opens forecasting analytics |
| **Variance Alerts** | Expand inline | Shows detailed variance report |
| **Budget Status** | Modal | Interactive budget breakdown |

### TIME INTELLIGENCE DASHBOARD

#### KPI Cards
| Card | Route/Action | Description |
|------|--------------|-------------|
| **Total Hours** | `/time-tracking/summary` | Weekly summary view |
| **Billable Hours** | Filter view | Billable-only breakdown |
| **Non-Billable** | Filter view | Non-billable analysis |
| **Overtime** | `/time-tracking/overtime` | Overtime analytics page |
| **Active Workers** | `/resources` | Team utilization page |
| **Avg Daily Hours** | Modal | Performance dashboard |

#### Work Package Interactions
| Element | Action | Description |
|---------|--------|-------------|
| **Work Package Row** | Slide-over panel | Detailed time entries |
| **Team Member Card** | Modal | Individual performance |
| **Utilization Ring** | Expand inline | Detailed breakdown |

#### Cost Integration
| Card | Action | Description |
|------|--------|-------------|
| **Labor Cost Generated** | `/cost-tracking?filter=labor` | Cost page with labor filter |

## Implementation Pattern

### InteractiveCard Component

```typescript
interface InteractiveCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    color: string;
  };
  progress?: {
    value: number;
    color: string;
  };
  badge?: {
    text: string;
    color: string;
  };
  onClick?: () => void;
  to?: string;
  className?: string;
}
```

### Usage Example

```tsx
<InteractiveCard
  icon={Package}
  iconColor="text-blue-400"
  title="Total Tasks"
  value={128}
  subtitle="14 overdue"
  trend={{
    value: "+12%",
    direction: "up",
    color: "text-green-400"
  }}
  to="/work-packages"
/>
```

## Interaction Patterns

### Option A: Full Page Navigation
**Use for:** Complex data requiring full context
```tsx
onClick={() => navigate('/work-packages')}
```

### Option B: Slide-Over Panel
**Use for:** Quick edits and detailed views
```tsx
onClick={() => setSlideOverOpen(true)}
```

### Option C: Modal
**Use for:** Quick actions and confirmations
```tsx
onClick={() => setModalOpen(true)}
```

### Option D: Inline Expansion
**Use for:** Summary expansions
```tsx
onClick={() => setExpanded(!expanded)}
```

## Micro-Interactions

### Smooth Transitions
```css
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Loading States
```tsx
{isLoading && (
  <div className="absolute inset-0 bg-[#0A0A0A]/80 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
  </div>
)}
```

### Animated Counters
```tsx
<CountUp
  end={value}
  duration={1}
  separator=","
  decimals={decimals}
/>
```

### Progress Animations
```css
.progress-bar {
  transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Trend Arrows
```tsx
{trend === 'up' && <TrendingUp className="w-4 h-4 animate-bounce" />}
```

## Accessibility

### Keyboard Navigation
- All cards are keyboard accessible
- Tab order follows visual hierarchy
- Enter/Space triggers card action
- Escape closes modals/panels

### ARIA Labels
```tsx
<div
  role="button"
  tabIndex={0}
  aria-label={`View ${title} details`}
  aria-describedby={`${id}-description`}
>
```

### Focus Management
```tsx
const cardRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen) {
    cardRef.current?.focus();
  }
}, [isOpen]);
```

## Error Handling

### User-Friendly Messages
```tsx
// ❌ BAD
"Request failed with status code 500"

// ✅ GOOD
"Unable to load cost data. Please check your connection or try again."
```

### Retry Mechanism
```tsx
<button
  onClick={handleRetry}
  className="text-xs text-blue-400 hover:text-blue-300 underline"
>
  Try again
</button>
```

### Technical Details Toggle
```tsx
{showDetails && (
  <details className="mt-2">
    <summary className="text-xs text-gray-500 cursor-pointer">
      Technical details
    </summary>
    <pre className="text-xs text-gray-600 mt-1">{error.stack}</pre>
  </details>
)}
```

## Performance Optimization

### Lazy Loading
```tsx
const DeepAnalytics = lazy(() => import('./DeepAnalytics'));

<Suspense fallback={<LoadingSkeleton />}>
  <DeepAnalytics />
</Suspense>
```

### Optimistic UI
```tsx
const handleClick = async () => {
  // Update UI immediately
  setLocalState(newValue);
  
  try {
    await api.update(newValue);
  } catch (error) {
    // Revert on error
    setLocalState(oldValue);
    showError();
  }
};
```

### Debounced Actions
```tsx
const debouncedSearch = useMemo(
  () => debounce((value) => performSearch(value), 300),
  []
);
```

## Responsive Design

### Mobile Adaptations
```tsx
// Desktop: Slide-over panel
// Mobile: Full screen modal

const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? (
  <FullScreenModal />
) : (
  <SlideOverPanel />
)}
```

### Touch Interactions
```css
@media (hover: none) {
  .interactive-card:active {
    transform: scale(0.98);
  }
}
```

## Testing Checklist

- [ ] All KPI cards are clickable
- [ ] Hover states work correctly
- [ ] Keyboard navigation functions
- [ ] Focus indicators visible
- [ ] Loading states display
- [ ] Error messages are user-friendly
- [ ] Retry mechanisms work
- [ ] Transitions are smooth (200ms)
- [ ] Mobile interactions work
- [ ] Touch feedback on mobile
- [ ] No dead/static cards
- [ ] All routes are valid
- [ ] Modals close properly
- [ ] Panels slide correctly
- [ ] Data updates reflect immediately

## Product Identity

Every card interaction reinforces:
- **NOT** a generic project manager
- **IS** a BIM-integrated Construction Intelligence System
- **IS** a Financial + Labor Control OS
- **IS** a Strategic Project Command Platform

## Final Outcome

After implementation:
- ✅ No static KPI cards exist
- ✅ Every number leads somewhere
- ✅ Every metric is actionable
- ✅ Every page feels interconnected
- ✅ The app behaves like a unified system
- ✅ Not isolated modules

---

**Status:** Implementation Ready
**Version:** 1.0
**Last Updated:** February 23, 2026
