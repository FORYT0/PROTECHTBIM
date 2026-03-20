# Gantt Chart Library Setup

## Library Selection

After evaluating several Gantt chart libraries for React, we selected **gantt-task-react** for the following reasons:

### Evaluated Options

1. **DHTMLX Gantt** - Commercial library with GPL option
   - Pros: Feature-rich, mature, excellent documentation
   - Cons: GPL license requires open-sourcing or commercial license purchase
   - Not selected due to licensing constraints

2. **Bryntum Gantt** - Commercial library
   - Pros: Very powerful, enterprise-grade features
   - Cons: Expensive commercial license required
   - Not selected due to cost

3. **gantt-task-react** - Open source (MIT)
   - Pros: 
     - MIT license (free for commercial use)
     - Built specifically for React with TypeScript
     - Good interactive features (drag-and-drop, zoom levels)
     - Active maintenance
     - Lightweight and performant
   - Cons: 
     - Fewer advanced features than commercial options
     - Smaller community
   - **SELECTED** - Best balance of features, licensing, and React integration

### Key Features

The gantt-task-react library provides:

- ✅ Interactive drag-and-drop for task dates
- ✅ Progress bar editing
- ✅ Multiple zoom levels (Hour, Quarter Day, Half Day, Day, Week, Month, Year)
- ✅ Task dependencies visualization
- ✅ TypeScript support
- ✅ Customizable styling
- ✅ Task types (task, milestone, project)
- ✅ Event handlers for task changes

## Installation

```bash
npm install gantt-task-react --workspace=apps/web
```

## Implementation

### Components Created

1. **GanttChart.tsx** - Core wrapper component
   - Converts WorkPackage data to Gantt Task format
   - Handles task styling based on priority
   - Manages dependencies from WorkPackageRelations
   - Provides event handlers for task interactions

2. **GanttView.tsx** - Full-featured view component
   - Includes zoom level controls
   - Provides legend for priority colors
   - Handles task updates via API
   - Shows loading states

3. **ProjectGanttPage.tsx** - Page component
   - Loads work packages and relations for a project
   - Integrates GanttView with project data
   - Provides navigation and help text

### Data Mapping

Work packages are mapped to Gantt tasks as follows:

```typescript
WorkPackage -> Task
{
  id: wp.id,
  name: wp.subject,
  start: wp.start_date,
  end: wp.due_date,
  progress: wp.progress_percent,
  type: wp.type === 'milestone' ? 'milestone' : 
        wp.type === 'phase' ? 'project' : 'task',
  dependencies: [predecessor work package IDs],
  styles: {
    backgroundColor: priorityColor,
    // ...
  }
}
```

### Priority Color Coding

- **Low**: Green (#10b981)
- **Normal**: Blue (#3b82f6)
- **High**: Amber (#f59e0b)
- **Urgent**: Red (#ef4444)

## Usage

### Basic Usage

```tsx
import { GanttChart } from '../components/GanttChart';

<GanttChart
  workPackages={workPackages}
  relations={relations}
  viewMode={ViewMode.Day}
  onTaskChange={handleTaskChange}
  onProgressChange={handleProgressChange}
  onDoubleClick={handleTaskClick}
/>
```

### Full View with Controls

```tsx
import { GanttView } from '../components/GanttView';

<GanttView
  workPackages={workPackages}
  relations={relations}
  onTaskUpdate={handleTaskUpdate}
  onTaskClick={handleTaskClick}
/>
```

## Integration with Backend

The Gantt chart integrates with the existing work package API:

- **GET /api/v1/work_packages** - Fetch work packages for a project
- **GET /api/v1/work_packages/:id/relations** - Fetch dependencies
- **PATCH /api/v1/work_packages/:id** - Update task dates/progress

When a user drags a task or updates progress, the component:
1. Calls the update API endpoint
2. Reloads the work packages to reflect changes
3. Shows loading state during update

## Future Enhancements

Potential improvements for Phase 2 tasks:

1. **Automatic Scheduling** (Task 7.4)
   - Implement scheduling engine to recalculate dependent task dates
   - Support lag days in dependencies
   - Handle manual vs automatic scheduling modes

2. **Baseline Comparison** (Task 8.2)
   - Add baseline bars to show original vs current schedule
   - Display variance indicators

3. **Critical Path** (Future)
   - Highlight critical path tasks
   - Calculate float/slack time

4. **Resource Loading** (Future)
   - Show resource allocation on timeline
   - Identify over-allocation

## Requirements Satisfied

This implementation satisfies **Requirement 2.1**:
> THE System SHALL render interactive Gantt charts with zoom levels from hours to years

The library provides:
- ✅ Interactive rendering with drag-and-drop
- ✅ Zoom levels: Hour, Quarter Day, Half Day, Day, Week, Month, Year
- ✅ Visual timeline representation
- ✅ Task dependencies display

## Testing

To test the Gantt chart:

1. Create a project with work packages that have start and due dates
2. Navigate to the project detail page
3. Click "View Gantt Chart" button
4. Test interactions:
   - Drag task bars to change dates
   - Drag progress bars to update completion
   - Use zoom controls to change time scale
   - Double-click tasks to view details

## References

- [gantt-task-react GitHub](https://github.com/MaTeMaTuK/gantt-task-react)
- [gantt-task-react npm](https://www.npmjs.com/package/gantt-task-react)
- License: MIT
