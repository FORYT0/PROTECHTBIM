import request from 'supertest';
import express, { Express } from 'express';
import { createICalendarRouter } from '../../routes/icalendar.routes';
import { ICalendarService } from '../../services/ICalendarService';

// Mock the authenticate middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateToken: () => (req: any, _res: any, next: any) => {
    req.user = {
      userId: 'user-1',
      email: 'test@example.com',
      roles: ['user'],
    };
    next();
  },
  createAuthService: jest.fn(),
}));

describe('iCalendar Routes', () => {
  let app: Express;
  let mockICalendarService: jest.Mocked<ICalendarService>;

  beforeEach(() => {
    mockICalendarService = {
      generateProjectCalendar: jest.fn(),
      generateUserCalendar: jest.fn(),
    } as any;

    app = express();
    app.use(express.json());
    app.use('/api/v1/icalendar', createICalendarRouter(mockICalendarService));
  });

  describe('GET /api/v1/icalendar/projects/:projectId', () => {
    it('should return iCalendar feed for a project', async () => {
      const projectId = 'project-1';
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PROTECHT BIM//Project Management//EN
NAME:Test Project - Work Packages
BEGIN:VEVENT
UID:wp-1
SUMMARY:[TASK] Test Task
DTSTART:20240201T000000Z
DTEND:20240215T000000Z
END:VEVENT
END:VCALENDAR`;

      mockICalendarService.generateProjectCalendar.mockResolvedValue(icsContent);

      const response = await request(app)
        .get(`/api/v1/icalendar/projects/${projectId}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/calendar');
      expect(response.headers['content-disposition']).toContain(
        `attachment; filename="project-${projectId}.ics"`
      );
      expect(response.text).toBe(icsContent);

      expect(mockICalendarService.generateProjectCalendar).toHaveBeenCalledWith({
        projectId,
        baseUrl: expect.stringContaining('http'),
      });
    });

    it('should return 404 if project not found', async () => {
      const projectId = 'nonexistent';

      mockICalendarService.generateProjectCalendar.mockRejectedValue(
        new Error('Project not found')
      );

      const response = await request(app)
        .get(`/api/v1/icalendar/projects/${projectId}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not Found',
        message: 'Project not found',
      });
    });

    it('should return 500 on service error', async () => {
      const projectId = 'project-1';

      mockICalendarService.generateProjectCalendar.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get(`/api/v1/icalendar/projects/${projectId}`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'Database error',
      });
    });
  });

  describe('GET /api/v1/icalendar/users/me', () => {
    it('should return iCalendar feed for authenticated user', async () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PROTECHT BIM//Project Management//EN
NAME:My Work Packages
BEGIN:VEVENT
UID:wp-1
SUMMARY:[TASK] My Task
DTSTART:20240201T000000Z
DTEND:20240215T000000Z
END:VEVENT
END:VCALENDAR`;

      mockICalendarService.generateUserCalendar.mockResolvedValue(icsContent);

      const response = await request(app)
        .get('/api/v1/icalendar/users/me')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/calendar');
      expect(response.headers['content-disposition']).toContain(
        'attachment; filename="my-work-packages.ics"'
      );
      expect(response.text).toBe(icsContent);

      expect(mockICalendarService.generateUserCalendar).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('http')
      );
    });

    it('should return 500 on service error', async () => {
      mockICalendarService.generateUserCalendar.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/v1/icalendar/users/me')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'Database error',
      });
    });
  });
});
