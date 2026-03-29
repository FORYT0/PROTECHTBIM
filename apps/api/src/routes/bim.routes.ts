import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

const router = Router();
const authService = createAuthService();
const authenticate = authenticateToken(authService);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.ifc') {
      cb(null, true);
    } else {
      cb(new Error('Only .ifc files are allowed'));
    }
  },
});

// In-memory store (replace with DB + MinIO in production)
const modelsStore = new Map<string, any>();
const clashesStore = new Map<string, any[]>();
const bcfStore = new Map<string, any[]>();

// ── Models ──────────────────────────────────────────────────

router.get('/projects/:projectId/bim/models', authenticate, (req: Request, res: Response) => {
  const models = Array.from(modelsStore.values())
    .filter((m) => m.projectId === req.params.projectId);
  res.json({ models });
});

router.post(
  '/projects/:projectId/bim/models',
  authenticate,
  upload.single('file'),
  (req: Request, res: Response): void => {
    if (!req.file) { res.status(400).json({ error: 'No IFC file provided' }); return; }

    const { projectId } = req.params;
    const userId = (req as any).user?.userId ?? 'unknown';
    const modelId = uuidv4();

    const model = {
      id: modelId,
      projectId,
      uploadedBy: userId,
      name: req.file.originalname.replace(/\.ifc$/i, ''),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      status: 'ready',
      storageUrl: null,
      metadata: null,
      uploadedAt: new Date().toISOString(),
    };

    modelsStore.set(modelId, model);
    res.status(201).json({ model });
  }
);

router.get('/bim/models/:modelId', authenticate, (req: Request, res: Response): void => {
  const model = modelsStore.get(req.params.modelId);
  if (!model) { res.status(404).json({ error: 'Model not found' }); return; }
  res.json({ model });
});

router.get('/bim/models/:modelId/download', authenticate, (req: Request, res: Response): void => {
  const model = modelsStore.get(req.params.modelId);
  if (!model) { res.status(404).json({ error: 'Model not found' }); return; }
  res.json({ url: model.storageUrl ?? `/api/v1/bim/models/${req.params.modelId}/file` });
});

router.delete('/bim/models/:modelId', authenticate, (req: Request, res: Response) => {
  modelsStore.delete(req.params.modelId);
  res.status(204).send();
});

// ── Clash Detection ─────────────────────────────────────────

router.post('/bim/clash-detection', authenticate, (req: Request, res: Response): void => {
  const { modelIds, tolerance = 0.01 } = req.body;
  if (!Array.isArray(modelIds) || modelIds.length < 2) {
    res.status(400).json({ error: 'Provide at least 2 model IDs' });
    return;
  }
  const jobId = uuidv4();
  res.status(202).json({ jobId, status: 'queued' });
});

router.get('/projects/:projectId/bim/clashes', authenticate, (req: Request, res: Response) => {
  const clashes = clashesStore.get(req.params.projectId) ?? [];
  res.json({ clashes });
});

router.get('/bim/clash-detection/:jobId', authenticate, (req: Request, res: Response) => {
  res.json({ jobId: req.params.jobId, status: 'completed', clashCount: 0 });
});

router.patch('/bim/clashes/:clashId', authenticate, (req: Request, res: Response) => {
  res.json({ clash: { id: req.params.clashId, ...req.body } });
});

// ── BCF Issues ──────────────────────────────────────────────

router.get('/projects/:projectId/bim/bcf', authenticate, (req: Request, res: Response) => {
  const issues = bcfStore.get(req.params.projectId) ?? [];
  res.json({ issues });
});

router.post('/projects/:projectId/bim/bcf', authenticate, (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user?.userId ?? 'unknown';
  const issue = {
    id: uuidv4(),
    projectId,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    comments: [],
    labels: [],
    status: 'open',
    ...req.body,
  };
  const existing = bcfStore.get(projectId) ?? [];
  bcfStore.set(projectId, [issue, ...existing]);
  res.status(201).json({ issue });
});

router.patch('/bim/bcf/:issueId', authenticate, (req: Request, res: Response) => {
  res.json({ issue: { id: req.params.issueId, ...req.body } });
});

router.post('/bim/bcf/:issueId/comments', authenticate, (req: Request, res: Response) => {
  const userId = (req as any).user?.userId ?? 'unknown';
  const comment = {
    id: uuidv4(),
    author: userId,
    comment: req.body.comment,
    date: new Date().toISOString(),
  };
  res.json({ issue: { id: req.params.issueId, comments: [comment] } });
});

router.get('/projects/:projectId/bim/bcf/export', authenticate, (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="issues.bcf"');
  res.send(Buffer.from('BCF export placeholder'));
});

export default router;
