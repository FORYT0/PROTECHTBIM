import { Router, Request, Response } from 'express';
import { ICalendarService, createICalendarService } from '../services/ICalendarService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createICalendarRouter = (icalendarService?: ICalendarService): Router => {
  const router = Router();
  const service = icalendarService || createICalendarService();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  /**
   * GET /api/v1/icalendar/projects/:projectId
   * Generate iCalendar feed for a project
   * Returns ICS file that can be subscribed to in external calendar apps
   */
  router.get('/projects/:projectId', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      // Get base URL from request
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      // Generate calendar
      const icsContent = await service.generateProjectCalendar({
        projectId,
        baseUrl,
      });

      // Set appropriate headers for ICS file
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="project-${projectId}.ics"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      return res.status(200).send(icsContent);
    } catch (error: any) {
      console.error('Error generating project calendar:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to generate calendar',
      });
    }
  });

  /**
   * GET /api/v1/icalendar/users/me
   * Generate iCalendar feed for the authenticated user's assigned work packages
   * Returns ICS file that can be subscribed to in external calendar apps
   */
  router.get('/users/me', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Get base URL from request
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      // Generate calendar
      const icsContent = await service.generateUserCalendar(userId, baseUrl);

      // Set appropriate headers for ICS file
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="my-work-packages.ics"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      return res.status(200).send(icsContent);
    } catch (error: any) {
      console.error('Error generating user calendar:', error);

      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to generate calendar',
      });
    }
  });

  return router;
};
