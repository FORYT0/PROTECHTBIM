/**
 * PROTECHT BIM API — Vercel Serverless Entry Point (DIAGNOSTIC BUILD)
 * Minimal version with no src/ imports to isolate runtime crash.
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'diagnostic build — no DB',
    timestamp: new Date().toISOString(),
    service: 'protecht-bim-api',
    version: '0.1.0-diag',
  });
});

app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({ name: 'PROTECHT BIM API', version: '0.1.0-diag', status: 'diagnostic' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

const handler = async (req: Request, res: Response) => {
  app(req, res);
};

export default handler;
