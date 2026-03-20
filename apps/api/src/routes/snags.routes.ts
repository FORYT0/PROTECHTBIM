import { Router, Request, Response } from 'express';
import { SnagService } from '../services/SnagService';
import { authenticateToken } from '../middleware/auth.middleware';
import { SnagSeverity, SnagCategory, SnagStatus } from '../entities/Snag';

const router = Router();
const snagService = new SnagService();

// Get all snags
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Fetching all snags');
    const snags = await snagService.getAllSnags();
    console.log('✅ Found snags:', snags.length);
    res.json({ snags });
  } catch (error: any) {
    console.error('❌ Error fetching snags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create snag (no auth required for testing)
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || 'a0077b22-fc68-408c-b1ce-aab3d36855de';

    console.log('📝 Creating snag:', req.body);

    const snag = await snagService.createSnag(
      {
        projectId: req.body.projectId,
        workPackageId: req.body.workPackageId,
        location: req.body.location,
        description: req.body.description,
        severity: req.body.severity as SnagSeverity,
        category: req.body.category as SnagCategory,
        assignedTo: req.body.assignedTo,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        costImpact: req.body.costImpact ? parseFloat(req.body.costImpact) : undefined,
        photoUrls: req.body.photoUrls,
      },
      userId
    );

    console.log('✅ Snag created:', snag.id);
    res.status(201).json({ snag });
  } catch (error: any) {
    console.error('❌ Error creating snag:', error);
    res.status(400).json({ error: error.message });
  }
});

// All other routes require authentication
router.use(authenticateToken);

// Get snag by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const snag = await snagService.getSnagById(req.params.id);

    if (!snag) {
      return res.status(404).json({ error: 'Snag not found' });
    }

    res.json({ snag });
  } catch (error: any) {
    console.error('Error fetching snag:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get snags by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const snags = await snagService.getSnagsByProject(req.params.projectId);
    res.json({ snags });
  } catch (error: any) {
    console.error('Error fetching snags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get snags by work package
router.get('/work-package/:workPackageId', async (req: Request, res: Response) => {
  try {
    const snags = await snagService.getSnagsByWorkPackage(req.params.workPackageId);
    res.json({ snags });
  } catch (error: any) {
    console.error('Error fetching snags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get snags by status
router.get('/project/:projectId/status/:status', async (req: Request, res: Response) => {
  try {
    const snags = await snagService.getSnagsByStatus(
      req.params.projectId,
      req.params.status as SnagStatus
    );
    res.json({ snags });
  } catch (error: any) {
    console.error('Error fetching snags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update snag
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const snag = await snagService.updateSnag(
      req.params.id,
      {
        location: req.body.location,
        description: req.body.description,
        severity: req.body.severity as SnagSeverity,
        category: req.body.category as SnagCategory,
        assignedTo: req.body.assignedTo,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        costImpact: req.body.costImpact ? parseFloat(req.body.costImpact) : undefined,
        rectificationCost: req.body.rectificationCost ? parseFloat(req.body.rectificationCost) : undefined,
        photoUrls: req.body.photoUrls,
      },
      userId
    );

    res.json({ snag });
  } catch (error: any) {
    console.error('Error updating snag:', error);
    res.status(400).json({ error: error.message });
  }
});

// Assign snag
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const assignedTo = req.body.assignedTo;

    if (!assignedTo) {
      return res.status(400).json({ error: 'assignedTo is required' });
    }

    const snag = await snagService.assignSnag(req.params.id, assignedTo, userId);
    res.json({ snag });
  } catch (error: any) {
    console.error('Error assigning snag:', error);
    res.status(400).json({ error: error.message });
  }
});

// Resolve snag
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const rectificationCost = req.body.rectificationCost ? parseFloat(req.body.rectificationCost) : undefined;

    const snag = await snagService.resolveSnag(req.params.id, userId, rectificationCost);
    res.json({ snag });
  } catch (error: any) {
    console.error('Error resolving snag:', error);
    res.status(400).json({ error: error.message });
  }
});

// Verify snag
router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const snag = await snagService.verifySnag(req.params.id, userId);
    res.json({ snag });
  } catch (error: any) {
    console.error('Error verifying snag:', error);
    res.status(400).json({ error: error.message });
  }
});

// Close snag
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const snag = await snagService.closeSnag(req.params.id, userId);
    res.json({ snag });
  } catch (error: any) {
    console.error('Error closing snag:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get snag metrics for project
router.get('/project/:projectId/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await snagService.getSnagMetrics(req.params.projectId);
    res.json({ metrics });
  } catch (error: any) {
    console.error('Error fetching snag metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete snag
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await snagService.deleteSnag(req.params.id, userId);
    res.json({ message: 'Snag deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting snag:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
