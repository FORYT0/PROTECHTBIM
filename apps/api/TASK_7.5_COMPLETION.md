# Task 7.5: Work Week Configuration - Completion Report

## Overview
Implemented comprehensive work week configuration system that allows projects to define custom working days, working hours, and holidays. The scheduling engine now respects work calendars when calculating task dates.

## Implementation Details

### 1. Work Calendar Entity (`WorkCalendar`)
Created a flexible work calendar model with:
- **Working Days**: Configurable days of the week (e.g., Monday-Friday, or Monday-Saturday)
- **Working Hours**: Start and end times for each working day
- **Hours Per Day**: Total working hours per day (e.g., 8 hours)
- **Holidays**: List of non-working dates with names
- **Project Association**: Can be project-specific or system-wide default
- **Default Calendar**: System automatically creates a default Monday-Friday, 8:00-17:00 calendar

### 2. Work Calendar Repository
Implemented repository with methods for:
- Creating and updating calendars
- Finding calendars by project ID
- Finding the default calendar
- Listing all calendars
- Deleting calendars (with protection for the only default)

### 3. Work Calendar Service
Created service with business logic for:
- **Calendar Management**:
  - Get calendar for a project (falls back to default if none exists)
  - Create/update project-specific calendars
  - Delete calendars with validation
  
- **Working Day Calculations**:
  - `isWorkingDay()`: Check if a date is a working day
  - `addWorkingDays()`: Add/subtract working days (skips weekends and holidays)
  - `calculateWorkingDays()`: Count working days between two dates
  - `getNextWorkingDay()`: Find the next working day
  - `getPreviousWorkingDay()`: Find the previous working day

### 4. Scheduling Engine Integration
Updated `SchedulingService` to use work calendars:
- Retrieves project calendar when recalculating schedules
- Uses working days instead of calendar days for lag calculations
- Calculates task durations in working days
- Ensures successor tasks start on working days
- Respects holidays and non-working days in all date calculations

### 5. API Endpoints
Created REST API routes for calendar management:

**Project Calendar Management:**
- `GET /api/v1/projects/:projectId/calendar` - Get project's work calendar
- `POST /api/v1/projects/:projectId/calendar` - Create/update project calendar

**Global Calendar Management:**
- `GET /api/v1/calendars` - List all calendars
- `GET /api/v1/calendars/:id` - Get specific calendar
- `DELETE /api/v1/calendars/:id` - Delete calendar

**Request Validation:**
- Validates working days are valid day-of-week values (0-6)
- Validates working hours are within 0-23 for hours, 0-59 for minutes
- Ensures end time is after start time
- Validates hours per day is between 0 and 24
- Prevents deletion of the only default calendar

### 6. Database Migration
Created migration `1704100000000-CreateWorkCalendars.ts`:
- Creates `work_calendars` table with all required columns
- Adds indexes on `project_id` and `is_default`
- Creates foreign key to `projects` table with CASCADE delete
- Inserts default work calendar on migration

### 7. Shared Types
Added TypeScript types to `libs/shared-types`:
- `WorkCalendar` interface
- `DayOfWeek` enum
- `WorkingHours` interface
- `Holiday` interface
- `CreateWorkCalendarRequest` interface
- `UpdateWorkCalendarRequest` interface

### 8. Comprehensive Testing
Created unit tests for `WorkCalendarService` with 23 test cases covering:
- Calendar retrieval and fallback logic
- Working day detection (weekdays, weekends, holidays)
- Working day arithmetic (add/subtract days)
- Working day counting between dates
- Next/previous working day calculation
- Calendar creation and updates
- Calendar deletion with validation

**Test Results:** ✅ All 23 tests passing

## Features Implemented

### ✅ Work Calendar Model
- Stores working days (array of day-of-week values)
- Stores working hours (start/end time)
- Stores holidays (date + name)
- Project-specific or default calendars
- JSONB storage for flexible data structures

### ✅ Calendar Configuration API
- Create/update project calendars
- Get project calendar (with default fallback)
- List all calendars
- Delete calendars
- Full request validation

### ✅ Scheduling Integration
- Automatic date calculation uses working days
- Lag days calculated in working days
- Task durations calculated in working days
- Successor tasks start on working days
- Holidays and weekends automatically skipped

### ✅ Project-Specific Calendars
- Each project can have its own calendar
- Falls back to default if not configured
- Different projects can have different work weeks
- Supports various construction schedules (5-day, 6-day, etc.)

## Usage Examples

### Create a Project Calendar
```typescript
POST /api/v1/projects/project-123/calendar
{
  "name": "Construction Site Calendar",
  "description": "6-day work week for construction project",
  "workingDays": [1, 2, 3, 4, 5, 6], // Monday-Saturday
  "workingHours": {
    "startHour": 7,
    "startMinute": 0,
    "endHour": 16,
    "endMinute": 0
  },
  "hoursPerDay": 9,
  "holidays": [
    { "date": "2024-07-04", "name": "Independence Day" },
    { "date": "2024-12-25", "name": "Christmas" }
  ]
}
```

### Get Project Calendar
```typescript
GET /api/v1/projects/project-123/calendar
// Returns project calendar or default if none exists
```

### Scheduling Behavior
When a task's predecessor completes on Friday:
- **Without work calendar**: Successor starts on Saturday
- **With work calendar**: Successor starts on Monday (next working day)

When adding 5 days lag:
- **Without work calendar**: Adds 5 calendar days (includes weekends)
- **With work calendar**: Adds 5 working days (skips weekends and holidays)

## Technical Decisions

1. **JSONB Storage**: Used PostgreSQL JSONB for flexible storage of working days, hours, and holidays
2. **Default Calendar**: System automatically creates and uses a default calendar if none exists
3. **Cascade Delete**: Project calendars are deleted when projects are deleted
4. **Working Day Arithmetic**: All scheduling calculations now use working days instead of calendar days
5. **Holiday Format**: Holidays stored as ISO date strings (YYYY-MM-DD) for consistency

## Files Created/Modified

### Created:
- `apps/api/src/entities/WorkCalendar.ts` - Entity definition
- `apps/api/src/repositories/WorkCalendarRepository.ts` - Data access layer
- `apps/api/src/services/WorkCalendarService.ts` - Business logic
- `apps/api/src/routes/work-calendars.routes.ts` - API endpoints
- `apps/api/src/migrations/1704100000000-CreateWorkCalendars.ts` - Database migration
- `apps/api/src/__tests__/services/WorkCalendarService.test.ts` - Unit tests
- `libs/shared-types/src/models/work-calendar.ts` - TypeScript types

### Modified:
- `apps/api/src/entities/index.ts` - Added WorkCalendar export
- `apps/api/src/services/SchedulingService.ts` - Integrated work calendar logic
- `apps/api/src/config/data-source.ts` - Added WorkCalendar entity
- `apps/api/src/main.ts` - Added calendar routes
- `libs/shared-types/src/models/index.ts` - Added work-calendar export

## Requirements Satisfied

✅ **Requirement 2.6**: Support custom work week configuration (working days and hours)
- Projects can define custom working days (e.g., 5-day or 6-day weeks)
- Projects can define custom working hours
- System supports holiday calendars
- Default system-wide calendar available
- Scheduling engine respects work calendars

## Next Steps

To complete the work calendar integration:

1. **Frontend Implementation**:
   - Create calendar configuration UI
   - Add calendar selector in project settings
   - Display working days/hours in project details
   - Add holiday management interface

2. **Gantt Chart Integration**:
   - Highlight non-working days in Gantt chart
   - Show holidays on timeline
   - Update drag-and-drop to snap to working days

3. **Database Migration**:
   - Run migration when database is available
   - Verify default calendar is created

4. **API Documentation**:
   - Update OpenAPI/Swagger documentation
   - Add calendar endpoints to API docs

## Testing Notes

All unit tests pass successfully. The implementation correctly:
- Calculates working days between dates
- Skips weekends and holidays
- Handles edge cases (negative days, zero days)
- Validates calendar data
- Protects default calendar from deletion

**Note**: Integration tests require database connection. Migration should be run when database is available.
