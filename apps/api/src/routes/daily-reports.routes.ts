import { Router, Request, Response } from 'express';
import { DailyReportService } from '../services/DailyReportService';
import { authenticateToken } from '../middleware/auth.middleware';
import { DelayType, ResponsibleParty } from '../entities/DelayEvent';

const router = Router();
const dailyReportService = new DailyReportService();

// Get all daily reports
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Fetching all daily reports');
    const reports = await dailyReportService.getAllDailyReports();
    console.log('✅ Found daily reports:', reports.length);
    res.json({ reports });
  } catch (error: any) {
    console.error('❌ Error fetching daily reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create daily report (no auth required for testing)
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || 'a0077b22-fc68-408c-b1ce-aab3d36855de';

    console.log('📝 Creating daily report:', req.body);

    const dailyReport = await dailyReportService.createDailyReport(
      {
        projectId: req.body.projectId,
        reportDate: new Date(req.body.reportDate),
        weather: req.body.weather,
        temperature: req.body.temperature !== undefined ? parseFloat(req.body.temperature) : undefined,
        manpowerCount: req.body.manpowerCount !== undefined ? parseInt(req.body.manpowerCount) : undefined,
        equipmentCount: req.body.equipmentCount !== undefined ? parseInt(req.body.equipmentCount) : undefined,
        workCompleted: req.body.workCompleted,
        workPlannedTomorrow: req.body.workPlannedTomorrow,
        delays: req.body.delays,
        safetyIncidents: req.body.safetyIncidents,
        siteNotes: req.body.siteNotes,
        visitorsOnSite: req.body.visitorsOnSite,
        materialsDelivered: req.body.materialsDelivered,
      },
      userId
    );

    console.log('✅ Daily report created:', dailyReport.id);
    res.status(201).json({ dailyReport });
  } catch (error: any) {
    console.error('❌ Error creating daily report:', error);
    res.status(400).json({ error: error.message });
  }
});

// All other routes require authentication
router.use(authenticateToken);

// Get daily report by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dailyReport = await dailyReportService.getDailyReportById(req.params.id);

    if (!dailyReport) {
      return res.status(404).json({ error: 'Daily report not found' });
    }

    res.json({ dailyReport });
  } catch (error: any) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get daily reports by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const dailyReports = await dailyReportService.getDailyReportsByProject(req.params.projectId);
    res.json({ dailyReports });
  } catch (error: any) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get daily report by date
router.get('/project/:projectId/date/:date', async (req: Request, res: Response) => {
  try {
    const dailyReport = await dailyReportService.getDailyReportByDate(
      req.params.projectId,
      new Date(req.params.date)
    );

    if (!dailyReport) {
      return res.status(404).json({ error: 'Daily report not found for this date' });
    }

    res.json({ dailyReport });
  } catch (error: any) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update daily report
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const dailyReport = await dailyReportService.updateDailyReport(
      req.params.id,
      {
        weather: req.body.weather,
        temperature: req.body.temperature !== undefined ? parseFloat(req.body.temperature) : undefined,
        manpowerCount: req.body.manpowerCount !== undefined ? parseInt(req.body.manpowerCount) : undefined,
        equipmentCount: req.body.equipmentCount !== undefined ? parseInt(req.body.equipmentCount) : undefined,
        workCompleted: req.body.workCompleted,
        workPlannedTomorrow: req.body.workPlannedTomorrow,
        delays: req.body.delays,
        safetyIncidents: req.body.safetyIncidents,
        siteNotes: req.body.siteNotes,
        visitorsOnSite: req.body.visitorsOnSite,
        materialsDelivered: req.body.materialsDelivered,
      },
      userId
    );

    res.json({ dailyReport });
  } catch (error: any) {
    console.error('Error updating daily report:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create delay event
router.post('/delay-events', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const delayEvent = await dailyReportService.createDelayEvent(
      {
        dailyReportId: req.body.dailyReportId,
        projectId: req.body.projectId,
        delayType: req.body.delayType as DelayType,
        description: req.body.description,
        estimatedImpactDays: req.body.estimatedImpactDays ? parseInt(req.body.estimatedImpactDays) : undefined,
        costImpact: req.body.costImpact ? parseFloat(req.body.costImpact) : undefined,
        responsibleParty: req.body.responsibleParty as ResponsibleParty,
        mitigationAction: req.body.mitigationAction,
      },
      userId
    );

    res.status(201).json({ delayEvent });
  } catch (error: any) {
    console.error('Error creating delay event:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get delay events by project
router.get('/delay-events/project/:projectId', async (req: Request, res: Response) => {
  try {
    const delayEvents = await dailyReportService.getDelayEventsByProject(req.params.projectId);
    res.json({ delayEvents });
  } catch (error: any) {
    console.error('Error fetching delay events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get delay events by daily report
router.get('/:id/delay-events', async (req: Request, res: Response) => {
  try {
    const delayEvents = await dailyReportService.getDelayEventsByDailyReport(req.params.id);
    res.json({ delayEvents });
  } catch (error: any) {
    console.error('Error fetching delay events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get delay metrics for project
router.get('/delay-events/project/:projectId/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await dailyReportService.getDelayMetrics(req.params.projectId);
    res.json({ metrics });
  } catch (error: any) {
    console.error('Error fetching delay metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get daily report completion rate
router.get('/project/:projectId/completion-rate', async (req: Request, res: Response) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    const completionRate = await dailyReportService.getDailyReportCompletionRate(
      req.params.projectId,
      startDate,
      endDate
    );

    res.json({ completionRate });
  } catch (error: any) {
    console.error('Error fetching completion rate:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
