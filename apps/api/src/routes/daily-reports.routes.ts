import { Router, Request, Response } from 'express';
import { DailyReportService } from '../services/DailyReportService';
import { authenticateToken } from '../middleware/auth.middleware';
import { DelayType, ResponsibleParty } from '../entities/DelayEvent';

const router = Router();
const dailyReportService = new DailyReportService();

// ─── PUBLIC ROUTES ────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const reports = await dailyReportService.getAllDailyReports();
    res.json({ reports });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || req.body.createdBy || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to create daily report' });
    }
    const dailyReport = await dailyReportService.createDailyReport(
      {
        projectId: req.body.projectId,
        reportDate: new Date(req.body.reportDate || new Date()),
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
    res.status(201).json({ dailyReport });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── SPECIFIC COLLECTION ROUTES (BEFORE /:id) ────────────────────

// Get daily reports by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const dailyReports = await dailyReportService.getDailyReportsByProject(req.params.projectId);
    res.json({ dailyReports });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily report by date
router.get('/project/:projectId/date/:date', async (req: Request, res: Response) => {
  try {
    const dailyReport = await dailyReportService.getDailyReportByDate(
      req.params.projectId, new Date(req.params.date)
    );
    if (!dailyReport) return res.status(404).json({ error: 'Daily report not found for this date' });
    return res.json({ dailyReport });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get completion rate
router.get('/project/:projectId/completion-rate', async (req: Request, res: Response) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const completionRate = await dailyReportService.getDailyReportCompletionRate(
      req.params.projectId, startDate, endDate
    );
    res.json({ completionRate });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delay events — specific routes before /:id
router.post('/delay-events', authenticateToken, async (req: Request, res: Response) => {
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
    res.status(400).json({ error: error.message });
  }
});

router.get('/delay-events/project/:projectId', async (req: Request, res: Response) => {
  try {
    const delayEvents = await dailyReportService.getDelayEventsByProject(req.params.projectId);
    res.json({ delayEvents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/delay-events/project/:projectId/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await dailyReportService.getDelayMetrics(req.params.projectId);
    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────
router.use(authenticateToken);

// ─── INDIVIDUAL RESOURCE ROUTES ──────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dailyReport = await dailyReportService.getDailyReportById(req.params.id);
    if (!dailyReport) return res.status(404).json({ error: 'Daily report not found' });
    return res.json({ dailyReport });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

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
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/delay-events', async (req: Request, res: Response) => {
  try {
    const delayEvents = await dailyReportService.getDelayEventsByDailyReport(req.params.id);
    res.json({ delayEvents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
