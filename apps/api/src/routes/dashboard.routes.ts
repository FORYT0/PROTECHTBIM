import { Router, Request, Response } from 'express';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';
import { unifiedSnapshotService } from '../services/UnifiedSnapshotService';
import { aggregationService } from '../services/AggregationService';

/**
 * UNIFIED DASHBOARD API
 * 
 * Single endpoint that returns comprehensive project snapshot.
 * Serves all dashboard widgets, financial summaries, and analytics.
 * Real-time WebSocket keeps this fresh across all connected clients.
 * 
 * USAGE:
 * GET /api/v1/projects/:projectId/dashboard
 */

export const createDashboardRouter = (): Router => {
  const router = Router();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  /**
   * GET /api/v1/projects/:projectId/dashboard
   * 
   * Returns unified snapshot with:
   * - Financial reconciliation
   * - Resource utilization
   * - Schedule analysis
   * - Quality metrics
   * - Work package status
   * - Cache metadata
   * 
   * Response time: < 100ms (cached)
   */
  router.get('/projects/:projectId/dashboard', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Project ID is required',
        });
      }

      // Get unified snapshot (cached or computed)
      const snapshot = await unifiedSnapshotService.getProjectSnapshot(projectId);

      return res.status(200).json({
        success: true,
        data: {
          projectId: snapshot.projectId,
          
          // Financial Section
          financial: {
            contractValue: {
              original: snapshot.financial.contract.originalValue,
              revised: snapshot.financial.contract.revisedValue,
              variations: snapshot.financial.contract.variations,
            },
            
            budget: snapshot.financial.budget,
            
            costs: snapshot.financial.costs,
            
            changeOrders: snapshot.financial.changeOrders,
            
            profitability: snapshot.financial.profitability,
          },

          // Resources Section
          resources: snapshot.resources,

          // Schedule Section
          schedule: snapshot.schedule,

          // Work Packages Section
          workPackages: snapshot.workPackages,

          // Quality Section
          quality: snapshot.quality,

          // Cache metadata
          metadata: {
            lastUpdated: snapshot.lastUpdated,
            cacheExpiresAt: snapshot.cacheExpiresAt,
            isCached: snapshot.lastUpdated.getTime() > Date.now() - 300000, // 5 mins
          },
        },
      });
    } catch (error: any) {
      console.error('[Dashboard] Error getting project dashboard:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get dashboard',
      });
    }
  });

  /**
   * GET /api/v1/projects/:projectId/dashboard/financial
   * 
   * Detailed financial reconciliation only
   */
  router.get('/projects/:projectId/dashboard/financial', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const snapshot = await unifiedSnapshotService.getProjectSnapshot(projectId);

      return res.status(200).json({
        success: true,
        data: {
          projectId,
          financial: snapshot.financial,
          lastUpdated: snapshot.lastUpdated,
          profitability: snapshot.financial.profitability,
        },
      });
    } catch (error: any) {
      console.error('[Dashboard] Error getting financial section:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get financial data',
      });
    }
  });

  /**
   * GET /api/v1/projects/:projectId/dashboard/resources
   * 
   * Resource utilization and allocation
   */
  router.get('/projects/:projectId/dashboard/resources', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const snapshot = await unifiedSnapshotService.getProjectSnapshot(projectId);

      return res.status(200).json({
        success: true,
        data: {
          projectId,
          resources: snapshot.resources,
          lastUpdated: snapshot.lastUpdated,
        },
      });
    } catch (error: any) {
      console.error('[Dashboard] Error getting resources section:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get resource data',
      });
    }
  });

  /**
   * GET /api/v1/projects/:projectId/dashboard/schedule
   * 
   * Schedule status and projections
   */
  router.get('/projects/:projectId/dashboard/schedule', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const snapshot = await unifiedSnapshotService.getProjectSnapshot(projectId);

      return res.status(200).json({
        success: true,
        data: {
          projectId,
          schedule: snapshot.schedule,
          workPackages: snapshot.workPackages,
          lastUpdated: snapshot.lastUpdated,
        },
      });
    } catch (error: any) {
      console.error('[Dashboard] Error getting schedule section:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get schedule data',
      });
    }
  });

  /**
   * GET /api/v1/projects/:projectId/dashboard/analytics
   * 
   * Comprehensive analytics from aggregation service
   */
  router.get('/projects/:projectId/dashboard/analytics', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const [financial, resources, schedule, quality] = await Promise.all([
        aggregationService.getFinancialReconciliation(projectId),
        aggregationService.getResourceUtilization(projectId),
        aggregationService.getScheduleAnalysis(projectId),
        aggregationService.getQualityMetrics(projectId),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          projectId,
          financial,
          resources,
          schedule,
          quality,
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      console.error('[Dashboard] Error getting analytics:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get analytics',
      });
    }
  });

  /**
   * POST /api/v1/projects/:projectId/dashboard/refresh
   * 
   * Force refresh snapshot cache
   * Useful for manual cache invalidation
   */
  router.post('/projects/:projectId/dashboard/refresh', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      // Invalidate cache
      await unifiedSnapshotService.invalidateProjectSnapshot(projectId);

      // Get fresh snapshot
      const snapshot = await unifiedSnapshotService.getProjectSnapshot(projectId);

      return res.status(200).json({
        success: true,
        message: 'Dashboard cache refreshed',
        data: snapshot,
      });
    } catch (error: any) {
      console.error('[Dashboard] Error refreshing cache:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to refresh cache',
      });
    }
  });

  return router;
};
