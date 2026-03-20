import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { createBurndownService } from '../services/BurndownService';

const router = Router();

/**
 * GET /api/v1/sprints/:id/burndown
 * Get burndown chart data for a sprint
 */
router.get(
  '/sprints/:id/burndown',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const sprintId = req.params.id;

      const burndownService = createBurndownService();
      const burndown = await burndownService.getSprintBurndown(sprintId);

      return res.json({ burndown });
    } catch (error: any) {
      console.error('Error getting sprint burndown:', error);

      if (error.message === 'Sprint not found') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message || 'Failed to get burndown data' });
    }
  }
);

/**
 * POST /api/v1/sprints/:id/burndown/snapshot
 * Record a burndown snapshot for a sprint
 */
router.post(
  '/sprints/:id/burndown/snapshot',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const sprintId = req.params.id;
      const { date } = req.body;

      const burndownService = createBurndownService();
      const snapshot = await burndownService.recordBurndownSnapshot(
        sprintId,
        date ? new Date(date) : undefined
      );

      return res.status(201).json({
        success: true,
        snapshot: {
          date: snapshot.date,
          remaining_story_points: snapshot.remainingStoryPoints,
          completed_story_points: snapshot.completedStoryPoints,
          total_story_points: snapshot.totalStoryPoints,
        },
      });
    } catch (error: any) {
      console.error('Error recording burndown snapshot:', error);

      if (error.message === 'Sprint not found') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message || 'Failed to record snapshot' });
    }
  }
);

/**
 * GET /api/v1/projects/:id/burndown
 * Get release burndown chart data for a project
 */
router.get(
  '/projects/:id/burndown',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;
      const { version_id, start_date, end_date } = req.query;

      const burndownService = createBurndownService();
      const burndown = await burndownService.getReleaseBurndown(projectId, {
        versionId: version_id as string,
        startDate: start_date ? new Date(start_date as string) : undefined,
        endDate: end_date ? new Date(end_date as string) : undefined,
      });

      return res.json({ burndown });
    } catch (error: any) {
      console.error('Error getting release burndown:', error);
      return res.status(500).json({ error: error.message || 'Failed to get burndown data' });
    }
  }
);

/**
 * POST /api/v1/burndown/daily-snapshots
 * Trigger daily snapshot recording for all active sprints
 * This endpoint should be called by a cron job
 */
router.post(
  '/burndown/daily-snapshots',
  authenticateToken,
  async (_req: Request, res: Response) => {
    try {
      const burndownService = createBurndownService();
      await burndownService.recordDailySnapshots();

      return res.json({ success: true, message: 'Daily snapshots recorded' });
    } catch (error: any) {
      console.error('Error recording daily snapshots:', error);
      return res.status(500).json({ error: error.message || 'Failed to record snapshots' });
    }
  }
);

export default router;
