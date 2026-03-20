import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { createBaselineService } from '../services/BaselineService';

const router = Router();

/**
 * POST /api/v1/projects/:id/baselines
 * Create a new baseline for a project
 */
router.post(
  '/projects/:id/baselines',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.id;
      const { name, description } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!name) {
        res.status(400).json({ error: 'Baseline name is required' });
        return;
      }

      const baselineService = createBaselineService();
      const baseline = await baselineService.createBaseline({
        projectId,
        name,
        description,
        createdBy: userId,
      });

      res.status(201).json({ baseline });
    } catch (error: any) {
      console.error('Error creating baseline:', error);

      if (error.message === 'Project not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to create baseline' });
    }
  }
);

/**
 * GET /api/v1/projects/:id/baselines
 * List all baselines for a project
 */
router.get(
  '/projects/:id/baselines',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.id;

      const baselineService = createBaselineService();
      const baselines = await baselineService.listBaselines(projectId);

      res.json({ baselines });
    } catch (error: any) {
      console.error('Error listing baselines:', error);

      if (error.message === 'Project not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to list baselines' });
    }
  }
);

/**
 * GET /api/v1/baselines/:id
 * Get a specific baseline with work package snapshots
 */
router.get('/baselines/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const baselineId = req.params.id;

    const baselineService = createBaselineService();
    const baseline = await baselineService.getBaselineWithWorkPackages(baselineId);

    if (!baseline) {
      res.status(404).json({ error: 'Baseline not found' });
      return;
    }

    res.json({ baseline });
  } catch (error: any) {
    console.error('Error getting baseline:', error);
    res.status(500).json({ error: error.message || 'Failed to get baseline' });
  }
});

/**
 * DELETE /api/v1/baselines/:id
 * Delete a baseline
 */
router.delete(
  '/baselines/:id',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const baselineId = req.params.id;

      const baselineService = createBaselineService();
      const deleted = await baselineService.deleteBaseline(baselineId);

      if (!deleted) {
        res.status(404).json({ error: 'Baseline not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting baseline:', error);

      if (error.message === 'Baseline not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to delete baseline' });
    }
  }
);

/**
 * GET /api/v1/baselines/:id/variance
 * Get variance report comparing baseline to current schedule
 */
router.get(
  '/baselines/:id/variance',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const baselineId = req.params.id;

      const baselineService = createBaselineService();
      const report = await baselineService.calculateVariance(baselineId);

      res.json({ report });
    } catch (error: any) {
      console.error('Error calculating variance:', error);

      if (error.message === 'Baseline not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to calculate variance' });
    }
  }
);

export default router;
