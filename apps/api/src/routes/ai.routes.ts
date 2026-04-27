import { Router, Request, Response } from 'express';
import { aiService } from '../services/AIService';
import { authenticateToken, createAuthService } from '../middleware/auth.middleware';

export const createAiRouter = (): Router => {
  const router = Router();
  const authService = createAuthService();
  const authenticate = authenticateToken(authService);

  // Health check — no auth required
  router.get('/status', (_req: Request, res: Response) => {
    const hasKey = !!process.env.GROQ_API_KEY;
    res.json({ available: hasKey, model: 'llama-3.3-70b-versatile', provider: 'Groq', message: hasKey ? 'ARIA AI is ready' : 'GROQ_API_KEY not configured' });
  });

  // Chat
  router.post('/chat', authenticate, async (req: Request, res: Response) => {
    try {
      const { messages, projectContext } = req.body;
      if (!messages?.length) return res.status(400).json({ error: 'messages array is required' });
      const response = await aiService.chat(messages, projectContext);
      return res.json({ response, model: 'llama-3.3-70b-versatile' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'AI service unavailable' });
    }
  });

  // Risk score
  router.post('/risk-score', authenticate, async (req: Request, res: Response) => {
    try {
      const { scenario, projectContext } = req.body;
      if (!scenario) return res.status(400).json({ error: 'scenario is required' });
      return res.json(await aiService.evaluateRisk(scenario, projectContext));
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Risk evaluation failed' });
    }
  });

  // Project insights
  router.post('/insights', authenticate, async (req: Request, res: Response) => {
    try {
      const { projectData } = req.body;
      if (!projectData) return res.status(400).json({ error: 'projectData is required' });
      const insights = await aiService.generateProjectInsights(projectData);
      return res.json({ insights });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Insights generation failed' });
    }
  });

  // Analyze change order
  router.post('/analyze-change-order', authenticate, async (req: Request, res: Response) => {
    try {
      const { changeOrder } = req.body;
      if (!changeOrder) return res.status(400).json({ error: 'changeOrder is required' });
      return res.json(await aiService.analyzeChangeOrder(changeOrder));
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Analysis failed' });
    }
  });

  // Generate snag description
  router.post('/generate-snag-description', authenticate, async (req: Request, res: Response) => {
    try {
      const { location, category, severity } = req.body;
      if (!location || !category || !severity) return res.status(400).json({ error: 'location, category and severity required' });
      const description = await aiService.generateSnagDescription(location, category, severity);
      return res.json({ description });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Generation failed' });
    }
  });

  // Summarize daily report
  router.post('/summarize-report', authenticate, async (req: Request, res: Response) => {
    try {
      const { workCompleted, delays, safetyIncidents } = req.body;
      if (!workCompleted) return res.status(400).json({ error: 'workCompleted is required' });
      const summary = await aiService.summarizeDailyReport(workCompleted, delays, safetyIncidents);
      return res.json({ summary });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Summarization failed' });
    }
  });

  return router;
};

export default createAiRouter;
