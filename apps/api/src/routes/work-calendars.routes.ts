import { Router, Request, Response } from 'express';
import { createWorkCalendarService } from '../services/WorkCalendarService';
import { DayOfWeek } from '../entities/WorkCalendar';

const router = Router();
const calendarService = createWorkCalendarService();

/**
 * GET /api/v1/projects/:projectId/calendar
 * Get work calendar for a project
 */
router.get('/projects/:projectId/calendar', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const calendar = await calendarService.getCalendarForProject(projectId);

    return res.json(calendar);
  } catch (error) {
    console.error('Error fetching project calendar:', error);
    return res.status(500).json({ error: 'Failed to fetch project calendar' });
  }
});

/**
 * POST /api/v1/projects/:projectId/calendar
 * Create or update work calendar for a project
 */
router.post('/projects/:projectId/calendar', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, description, workingDays, workingHours, hoursPerDay, holidays } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Calendar name is required' });
    }

    // Validate working days
    if (workingDays && !Array.isArray(workingDays)) {
      return res.status(400).json({ error: 'Working days must be an array' });
    }

    if (workingDays) {
      const validDays = Object.values(DayOfWeek).filter((v) => typeof v === 'number');
      const invalidDays = workingDays.filter((day: number) => !validDays.includes(day));
      if (invalidDays.length > 0) {
        return res.status(400).json({ error: 'Invalid day of week values' });
      }
    }

    // Validate working hours
    if (workingHours) {
      const { startHour, startMinute, endHour, endMinute } = workingHours;
      if (
        startHour < 0 ||
        startHour > 23 ||
        endHour < 0 ||
        endHour > 23 ||
        startMinute < 0 ||
        startMinute > 59 ||
        endMinute < 0 ||
        endMinute > 59
      ) {
        return res.status(400).json({ error: 'Invalid working hours' });
      }

      // Check that end time is after start time
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      if (endMinutes <= startMinutes) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    }

    // Validate hours per day
    if (hoursPerDay !== undefined && (hoursPerDay <= 0 || hoursPerDay > 24)) {
      return res.status(400).json({ error: 'Hours per day must be between 0 and 24' });
    }

    // Validate holidays
    if (holidays && !Array.isArray(holidays)) {
      return res.status(400).json({ error: 'Holidays must be an array' });
    }

    const calendar = await calendarService.setProjectCalendar(projectId, {
      name,
      description,
      workingDays,
      workingHours,
      hoursPerDay,
      holidays,
    });

    return res.status(201).json(calendar);
  } catch (error) {
    console.error('Error creating/updating project calendar:', error);
    return res.status(500).json({ error: 'Failed to create/update project calendar' });
  }
});

/**
 * GET /api/v1/calendars
 * Get all work calendars
 */
router.get('/calendars', async (_req: Request, res: Response) => {
  try {
    const calendars = await calendarService.getAllCalendars();
    return res.json(calendars);
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return res.status(500).json({ error: 'Failed to fetch calendars' });
  }
});

/**
 * GET /api/v1/calendars/:id
 * Get a specific calendar by ID
 */
router.get('/calendars/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const calendar = await calendarService.getCalendarById(id);

    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    return res.json(calendar);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

/**
 * DELETE /api/v1/calendars/:id
 * Delete a calendar
 */
router.delete('/calendars/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await calendarService.deleteCalendar(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting calendar:', error);
    if (error.message === 'Cannot delete the only default calendar') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to delete calendar' });
  }
});

export default router;
