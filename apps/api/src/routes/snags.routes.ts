import { Router, Request, Response, NextFunction } from 'express';
import { SnagService } from '../services/SnagService';
import { authenticateToken } from '../middleware/auth.middleware';
import { SnagSeverity, SnagCategory, SnagStatus } from '../entities/Snag';

const router = Router();

// Optional auth: extract user from JWT if present, don't block if missing
const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
      const decoded = jwt.verify(token, secret) as any;
      (req as any).user = decoded;
    } catch {}
  }
  next();
};

const snagService = new SnagService();

// ─── PUBLIC ROUTES (no auth) ─────────────────────────────────────

// Get all snags
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const snags = await snagService.getAllSnags();
    res.json({ snags });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create snag
router.post('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || req.body.createdBy || req.body.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required to create snag' });
      return;
    }
    const snag = await snagService.createSnag(
      {
        projectId: req.body.projectId,
        workPackageId: req.body.workPackageId || undefined,
        location: req.body.location,
        description: req.body.description,
        severity: req.body.severity as SnagSeverity,
        category: req.body.category as SnagCategory,
        // Only pass assignedTo if it looks like a UUID (36 chars with dashes)
        assignedTo: req.body.assignedTo && /^[0-9a-f-]{36}$/i.test(req.body.assignedTo)
          ? req.body.assignedTo
          : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        costImpact: req.body.costImpact ? parseFloat(req.body.costImpact) : undefined,
        photoUrls: req.body.photoUrls,
      },
      userId
    );
    res.status(201).json({ snag });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── SPECIFIC COLLECTION ROUTES (must be before /:id) ────────────

// Get snags by project — MUST be before /:id
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const snags = await snagService.getSnagsByProject(req.params.projectId);
    res.json({ snags });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get snags by work package
router.get('/work-package/:workPackageId', async (req: Request, res: Response) => {
  try {
    const snags = await snagService.getSnagsByWorkPackage(req.params.workPackageId);
    res.json({ snags });
  } catch (error: any) {
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
    res.status(500).json({ error: error.message });
  }
});

// Get snag metrics for project
router.get('/project/:projectId/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await snagService.getSnagMetrics(req.params.projectId);
    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────
router.use(authenticateToken);

// ─── INDIVIDUAL RESOURCE ROUTES (after /:id specific routes) ────

// Get snag by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const snag = await snagService.getSnagById(req.params.id);
    if (!snag) return res.status(404).json({ error: 'Snag not found' });
    return res.json({ snag });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

// Assign snag
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ error: 'assignedTo is required' });
    const snag = await snagService.assignSnag(req.params.id, assignedTo, userId);
    return res.json({ snag });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

// Delete snag
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await snagService.deleteSnag(req.params.id, userId);
    res.json({ message: 'Snag deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
