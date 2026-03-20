import { Router, Request, Response } from 'express';
import { ResourceService, createResourceService } from '../services/ResourceService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createResourceRouter = (resourceService?: ResourceService): Router => {
    const router = Router();
    const service = resourceService || createResourceService();
    const authService = createAuthService();
    const authenticate = authenticateToken(authService);

    /**
     * GET /api/v1/resources/workload/:userId
     * Get workload for a specific user
     */
    router.get('/workload/:userId', authenticate, async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'startDate and endDate are required',
                });
            }

            const workload = await service.getUserWorkload(
                userId,
                new Date(startDate as string),
                new Date(endDate as string)
            );

            return res.status(200).json({ workload });
        } catch (error: any) {
            console.error('Error getting user workload:', error);
            return res.status(400).json({
                error: 'Bad Request',
                message: error.message || 'Failed to get user workload',
            });
        }
    });

    /**
     * GET /api/v1/resources/projects/:projectId/utilization
     * Get resource utilization for a project
     */
    router.get('/projects/:projectId/utilization', authenticate, async (req: Request, res: Response) => {
        try {
            const { projectId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'startDate and endDate are required',
                });
            }

            const utilization = await service.getProjectResourceUtilization(
                projectId,
                new Date(startDate as string),
                new Date(endDate as string)
            );

            return res.status(200).json({ utilization });
        } catch (error: any) {
            console.error('Error getting project utilization:', error);
            return res.status(400).json({
                error: 'Bad Request',
                message: error.message || 'Failed to get project utilization',
            });
        }
    });

    return router;
};
