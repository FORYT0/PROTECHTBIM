# Task 9.5 Completion: Backlog and Sprint Planning

## Overview
Implemented product backlog view and sprint planning interface for agile project management.

## Implementation Details

### Backend Changes

#### 1. API Endpoint for Product Backlog
**File:** `apps/api/src/routes/projects.routes.ts`
- Added `GET /api/v1/projects/:id/backlog` endpoint
- Returns work packages not assigned to any sprint (backlog items)
- Supports pagination and sorting
- Filters work packages where `sprint_id IS NULL`

#### 2. Work Package Repository Enhancement
**File:** `apps/api/src/repositories/WorkPackageRepository.ts`
- Added `sprintId` filter to `WorkPackageFilters` interface
- Supports `null` value to filter backlog items (not in any sprint)
- Updated `findAll` method to handle sprint filtering

### Frontend Changes

#### 1. Sprint Service
**File:** `apps/web/src/services/sprintService.ts`
- Created comprehensive sprint service with methods:
  - `createSprint()` - Create new sprint
  - `listSprints()` - List sprints for a project
  - `getSprint()` - Get sprint with work packages and stats
  - `updateSprint()` - Update sprint details
  - `deleteSprint()` - Delete sprint
  - `addWorkPackagesToSprint()` - Add work packages to sprint
  - `removeWorkPackagesFromSprint()` - Remove work packages from sprint

#### 2. Backlog Page
**File:** `apps/web/src/pages/BacklogPage.tsx`
- Product backlog view showing work packages not in any sprint
- Features:
  - Display all backlog items with details (type, status, priority, story points)
  - Multi-select functionality for work packages
  - Priority ordering with move up/down controls
  - Sprint selection dropdown
  - Bulk add to sprint functionality
  - Total story points calculation for selected items
  - Assignee information display

#### 3. Sprint Planning Page
**File:** `apps/web/src/pages/SprintPlanningPage.tsx`
- Detailed sprint planning interface
- Features:
  - Sprint information cards (status, duration, story points, capacity)
  - Capacity visualization with progress bar
  - Color-coded capacity indicator (green < 80%, yellow 80-100%, red > 100%)
  - List of work packages in sprint
  - Remove work packages from sprint
  - Total story points calculation
  - Capacity percentage display

#### 4. Routing Updates
**File:** `apps/web/src/App.tsx`
- Added route: `/projects/:projectId/backlog` → BacklogPage
- Added route: `/sprints/:sprintId/planning` → SprintPlanningPage

#### 5. Navigation Enhancement
**File:** `apps/web/src/pages/ProjectDetailPage.tsx`
- Added "Product Backlog" button to project detail page
- Links to backlog view for the project

## Features Implemented

### Product Backlog View (Requirement 4.3)
✅ Display work packages not assigned to any sprint
✅ Priority ordering with visual controls
✅ Multi-select functionality
✅ Story points display
✅ Assignee information

### Sprint Planning Interface (Requirement 4.4)
✅ Sprint selection dropdown
✅ Add work packages to sprint
✅ Remove work packages from sprint
✅ Sprint capacity planning

### Sprint Capacity and Story Points Display (Requirement 4.7)
✅ Total story points calculation
✅ Capacity vs. actual comparison
✅ Visual capacity indicator with color coding
✅ Percentage-based capacity display
✅ Progress bar visualization

## API Endpoints

### New Endpoint
```
GET /api/v1/projects/:id/backlog
```
**Query Parameters:**
- `page` - Page number (optional)
- `per_page` - Items per page (optional)
- `sort_by` - Sort field (optional)
- `sort_order` - Sort direction: ASC/DESC (optional)

**Response:**
```json
{
  "work_packages": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "type": "feature",
      "subject": "Work package title",
      "description": "Description",
      "status": "new",
      "priority": "normal",
      "story_points": 5,
      "estimated_hours": 8,
      "assignee": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "per_page": 20
}
```

## User Workflows

### 1. View Product Backlog
1. Navigate to project detail page
2. Click "Product Backlog" button
3. View all work packages not in any sprint
4. See story points and priority for each item

### 2. Plan Sprint
1. From backlog page, select work packages
2. Choose target sprint from dropdown
3. Click "Add to Sprint"
4. Work packages are moved to sprint

### 3. Manage Sprint Capacity
1. Navigate to sprint planning page
2. View sprint capacity and current story points
3. See capacity percentage and visual indicator
4. Remove work packages if over capacity

### 4. Prioritize Backlog
1. Use up/down arrows to reorder items
2. Higher priority items appear at top
3. Visual feedback for priority changes

## Technical Notes

### Sprint Filtering
- Backend filters work packages where `sprint_id IS NULL` for backlog
- Supports explicit sprint ID filtering for sprint views
- Efficient database queries with proper indexing

### Story Points Calculation
- Automatically calculated on backend when work packages added/removed
- Real-time updates on frontend
- Supports null/undefined story points (treated as 0)

### Capacity Management
- Visual indicators for capacity utilization
- Color-coded warnings (green/yellow/red)
- Percentage-based display
- Progress bar visualization

## Requirements Satisfied

✅ **Requirement 4.3:** Product backlog with priority ordering
✅ **Requirement 4.4:** Sprint backlogs with capacity planning
✅ **Requirement 4.7:** Story points as custom field for effort estimation

## Testing Recommendations

1. **Backlog Display:**
   - Verify work packages without sprint_id appear in backlog
   - Test pagination and sorting
   - Verify story points display correctly

2. **Sprint Planning:**
   - Test adding work packages to sprint
   - Verify story points calculation
   - Test capacity warnings (over/under capacity)
   - Test removing work packages from sprint

3. **Priority Ordering:**
   - Test move up/down functionality
   - Verify order persistence
   - Test with multiple items

4. **Multi-select:**
   - Test selecting/deselecting items
   - Test "Select All" functionality
   - Verify total story points calculation

## Future Enhancements

1. Drag-and-drop for priority ordering
2. Bulk edit for backlog items
3. Sprint velocity tracking
4. Burndown chart integration
5. Backlog grooming tools
6. Story point estimation tools
7. Sprint retrospective features

## Files Modified

### Backend
- `apps/api/src/routes/projects.routes.ts` - Added backlog endpoint
- `apps/api/src/repositories/WorkPackageRepository.ts` - Added sprint filtering
- `apps/api/.env` - Updated database port configuration

### Frontend
- `apps/web/src/services/sprintService.ts` - New sprint service
- `apps/web/src/pages/BacklogPage.tsx` - New backlog page
- `apps/web/src/pages/SprintPlanningPage.tsx` - New sprint planning page
- `apps/web/src/App.tsx` - Added routes
- `apps/web/src/pages/ProjectDetailPage.tsx` - Added navigation link

## Conclusion

Task 9.5 has been successfully implemented with all required features for backlog and sprint planning. The implementation provides a complete agile workflow for managing product backlogs, planning sprints, and tracking capacity.
