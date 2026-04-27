import { Router, Request, Response } from 'express';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

// Lazy-load aiService so missing GROQ_API_KEY doesn't crash the whole server
let _aiService: any = null;
async function getAI() {
  if (!_aiService) {
    const mod = await import('../services/AIService');
    _aiService = mod.aiService;
  }
  return _aiService;
}

export const createAiRouter = (): Router => {
  const router = Router();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // ── Health check — no auth, never throws ─────────────────────
  router.get('/status', (_req: Request, res: Response) => {
    const hasKey = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
    res.json({
      available: hasKey,
      model: 'llama-3.3-70b-versatile',
      provider: 'Groq',
      message: hasKey ? 'ARIA AI is ready' : 'Set GROQ_API_KEY in Railway Variables to activate ARIA',
    });
  });

  // ── Chat ─────────────────────────────────────────────────────
  router.post('/chat', authenticate, async (req: Request, res: Response) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        return res.status(503).json({ error: 'GROQ_API_KEY not configured. Set it in Railway Variables.' });
      }
      const { messages, projectContext } = req.body;
      if (!messages?.length) return res.status(400).json({ error: 'messages array is required' });
      const ai = await getAI();
      const response = await ai.chat(messages, projectContext);
      return res.json({ response, model: 'llama-3.3-70b-versatile' });
    } catch (e: any) {
      console.error('AI chat error:', e.message);
      return res.status(500).json({ error: e.message || 'AI service unavailable' });
    }
  });

  // ── Risk score ───────────────────────────────────────────────
  router.post('/risk-score', authenticate, async (req: Request, res: Response) => {
    try {
      if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
      const { scenario, projectContext } = req.body;
      if (!scenario) return res.status(400).json({ error: 'scenario is required' });
      const ai = await getAI();
      return res.json(await ai.evaluateRisk(scenario, projectContext));
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Risk evaluation failed' });
    }
  });

  // ── Project insights ─────────────────────────────────────────
  router.post('/insights', authenticate, async (req: Request, res: Response) => {
    try {
      if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
      const { projectData } = req.body;
      if (!projectData) return res.status(400).json({ error: 'projectData is required' });
      const ai = await getAI();
      const insights = await ai.generateProjectInsights(projectData);
      return res.json({ insights });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Insights generation failed' });
    }
  });

  // ── Analyze change order ─────────────────────────────────────
  router.post('/analyze-change-order', authenticate, async (req: Request, res: Response) => {
    try {
      if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
      const { changeOrder } = req.body;
      if (!changeOrder) return res.status(400).json({ error: 'changeOrder is required' });
      const ai = await getAI();
      return res.json(await ai.analyzeChangeOrder(changeOrder));
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Analysis failed' });
    }
  });

  // ── Generate snag description ────────────────────────────────
  router.post('/generate-snag-description', authenticate, async (req: Request, res: Response) => {
    try {
      if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
      const { location, category, severity } = req.body;
      if (!location || !category || !severity) return res.status(400).json({ error: 'location, category and severity required' });
      const ai = await getAI();
      const description = await ai.generateSnagDescription(location, category, severity);
      return res.json({ description });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Generation failed' });
    }
  });

  // ── Summarize daily report ───────────────────────────────────
  router.post('/summarize-report', authenticate, async (req: Request, res: Response) => {
    try {
      if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
      const { workCompleted, delays, safetyIncidents } = req.body;
      if (!workCompleted) return res.status(400).json({ error: 'workCompleted is required' });
      const ai = await getAI();
      const summary = await ai.summarizeDailyReport(workCompleted, delays, safetyIncidents);
      return res.json({ summary });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Summarization failed' });
    }
  });

  return router;
};

export default createAiRouter;
