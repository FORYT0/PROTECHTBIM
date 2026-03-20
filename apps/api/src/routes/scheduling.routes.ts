import { Router, Request, Response } from 'express';
import { SchedulingService, createSchedulingService } from '../services/SchedulingService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createSchedulingRouter = (schedulingService?: SchedulingService): Router => {
  const router = Router();
  const service = schedulingService || createSchedulingService();
  const authService = createAuthService();

  /**
   * POST /api/v1/projects/:projectId/scheduling/recalculate
   * Trigger scheduling recalculation for a project
   */
  router.post(
    '/:projectId/scheduling/recalculate',
    authenticateToken(authService),
    async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;
        const { workPackageIds } = req.body;

        if (!workPackageIds || !Array.isArray(workPackageIds)) {
          return res.status(400).json({
            error: 'workPackageIds array is required',
          });
        }

        const updates = await service.recalculateSchedule(projectId, workPackageIds);

        return res.json({
          success: true,
          updates,
          message: `Recalculated ${updates.length} work package(s)`,
        });
      } catch (error) {
        console.error('Error recalculating schedule:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to recalculate schedule',
        });
      }
    }
  );

  /**
   * GET /api/v1/projects/:projectId/scheduling/circular-dependencies
   * Detect circular dependencies in project
   */
  router.get(
    '/:projectId/scheduling/circular-dependencies',
    authenticateToken(authService),
    async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;

        const circularDependencies = await service.detectCircularDependencies(projectId);

        return res.json({
          circularDependencies,
          count: circularDependencies.length,
          hasCircularDependencies: circularDependencies.length > 0,
        });
      } catch (error) {
        console.error('Error detecting circular dependencies:', error);
        return res.status(500).json({
          error:
            error instanceof Error ? error.message : 'Failed to detect circular dependencies',
        });
      }
    }
  );

  return router;
};
