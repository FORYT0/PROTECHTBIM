import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { createSprintService } from '../services/SprintService';
import { SprintStatus } from '../entities/Sprint';

const router = Router();

/**
 * POST /api/v1/projects/:id/sprints
 * Create a new sprint for a project
 */
router.post(
  '/projects/:id/sprints',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;
      const { name, description, start_date, end_date, capacity } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Sprint name is required' });
      }

      if (!start_date) {
        return res.status(400).json({ error: 'Start date is required' });
      }

      if (!end_date) {
        return res.status(400).json({ error: 'End date is required' });
      }

      const sprintService = createSprintService();
      const sprint = await sprintService.createSprint({
        projectId,
        name,
        description,
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        capacity,
      });

      return res.status(201).json({ sprint });
    } catch (error: any) {
      console.error('Error creating sprint:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }

      if (error.message === 'End date must be after start date') {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message || 'Failed to create sprint' });
    }
  }
);

/**
 * GET /api/v1/projects/:id/sprints
 * List all sprints for a project
 */
router.get(
  '/projects/:id/sprints',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;
      const { status, page, per_page } = req.query;

      // Validate status if provided
      if (status && !Object.values(SprintStatus).includes(status as SprintStatus)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${Object.values(SprintStatus).join(', ')}`,
        });
      }

      const sprintService = createSprintService();
      const { sprints, total } = await sprintService.listSprints(projectId, {
        status: status as SprintStatus,
        page: page ? parseInt(page as string, 10) : undefined,
        perPage: per_page ? parseInt(per_page as string, 10) : undefined,
      });

      return res.json({
        sprints,
        total,
        page: page ? parseInt(page as string, 10) : 1,
        per_page: per_page ? parseInt(per_page as string, 10) : 50,
      });
    } catch (error: any) {
      console.error('Error listing sprints:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message || 'Failed to list sprints' });
    }
  }
);

/**
 * DELETE /api/v1/sprints/work-packages
 * Remove work packages from their sprint
 * NOTE: This route must come BEFORE /sprints/:id to avoid matching "work-packages" as an ID
 */
router.delete(
  '/sprints/work-packages',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { work_package_ids } = req.body;

      if (!work_package_ids || !Array.isArray(work_package_ids)) {
        return res.status(400).json({ error: 'work_package_ids array is required' });
      }

      if (work_package_ids.length === 0) {
        return res.status(400).json({ error: 'work_package_ids cannot be empty' });
      }

      const sprintService = createSprintService();
      await sprintService.removeWorkPackagesFromSprint(work_package_ids);

      return res.status(200).json({ message: 'Work packages removed from sprint' });
    } catch (error: any) {
      console.error('Error removing work packages from sprint:', error);
      return res
        .status(500)
        .json({ error: error.message || 'Failed to remove work packages from sprint' });
    }
  }
);

/**
 * GET /api/v1/sprints/:id
 * Get a specific sprint with work packages and stats
 */
router.get('/sprints/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sprintId = req.params.id;

    const sprintService = createSprintService();
    const result = await sprintService.getSprintWithStats(sprintId);

    if (!result) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    return res.json({
      sprint: result.sprint,
      work_packages: result.workPackages,
      total_story_points: result.totalStoryPoints,
    });
  } catch (error: any) {
    console.error('Error getting sprint:', error);
    return res.status(500).json({ error: error.message || 'Failed to get sprint' });
  }
});

/**
 * PATCH /api/v1/sprints/:id
 * Update a sprint
 */
router.patch('/sprints/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sprintId = req.params.id;
    const { name, description, status, start_date, end_date, capacity } = req.body;

    // Validate status if provided
    if (status && !Object.values(SprintStatus).includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${Object.values(SprintStatus).join(', ')}`,
      });
    }

    const sprintService = createSprintService();
    const sprint = await sprintService.updateSprint(sprintId, {
      name,
      description,
      status,
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      capacity,
    });

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    return res.json({ sprint });
  } catch (error: any) {
    console.error('Error updating sprint:', error);

    if (error.message === 'Sprint not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'End date must be after start date') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message || 'Failed to update sprint' });
  }
});

/**
 * DELETE /api/v1/sprints/:id
 * Delete a sprint
 */
router.delete('/sprints/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sprintId = req.params.id;

    const sprintService = createSprintService();
    const deleted = await sprintService.deleteSprint(sprintId);

    if (!deleted) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting sprint:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete sprint' });
  }
});

/**
 * POST /api/v1/sprints/:id/work-packages
 * Add work packages to a sprint
 */
router.post(
  '/sprints/:id/work-packages',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const sprintId = req.params.id;
      const { work_package_ids } = req.body;

      if (!work_package_ids || !Array.isArray(work_package_ids)) {
        return res.status(400).json({ error: 'work_package_ids array is required' });
      }

      if (work_package_ids.length === 0) {
        return res.status(400).json({ error: 'work_package_ids cannot be empty' });
      }

      const sprintService = createSprintService();
      await sprintService.addWorkPackagesToSprint(sprintId, work_package_ids);

      return res.status(200).json({ message: 'Work packages added to sprint' });
    } catch (error: any) {
      console.error('Error adding work packages to sprint:', error);

      if (error.message === 'Sprint not found') {
        return res.status(404).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: error.message || 'Failed to add work packages to sprint' });
    }
  }
);

export default router;
