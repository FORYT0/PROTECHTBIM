/**
 * PROTECHT BIM API — Vercel Serverless Entry Point
 * Last updated: 2026-05-23
 *
 * Identical to main.ts but:
 *  - No app.listen() — Vercel handles the port
 *  - No WebSocket init — not supported in serverless (real-time falls back to polling)
 *  - DB + Redis initialized lazily on first request so health check responds immediately
 */

import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { initializeDatabase } from '../src/config/data-source';
import { initializeRedis } from '../src/config/redis';
import { createAuthService } from '../src/middleware/auth.middleware';
import { createAuthRouter } from '../src/routes/auth.routes';
import rbacRoutes from '../src/routes/rbac.routes';
import { createProjectRouter } from '../src/routes/projects.routes';
import { createWorkPackageRouter } from '../src/routes/work-packages.routes';
import {
  createWorkPackageRelationRouter,
  createRelationRouter,
} from '../src/routes/work-package-relations.routes';
import { createSchedulingRouter } from '../src/routes/scheduling.routes';
import workCalendarRoutes from '../src/routes/work-calendars.routes';
import baselineRoutes from '../src/routes/baselines.routes';
import boardRoutes from '../src/routes/boards.routes';
import sprintRoutes from '../src/routes/sprints.routes';
import burndownRoutes from '../src/routes/burndown.routes';
import { createICalendarRouter } from '../src/routes/icalendar.routes';
import { createTimeEntryRouter } from '../src/routes/time-entries.routes';
import { createCostEntryRouter } from '../src/routes/cost-entries.routes';
import { createCostCodeRouter } from '../src/routes/cost-codes.routes';
import { createVendorRouter } from '../src/routes/vendors.routes';
import { createResourceRateRouter } from '../src/routes/resource-rates.routes';
import { createBudgetRouter } from '../src/routes/budgets.routes';
import { createActivityRouter } from '../src/routes/activity.routes';
import { createCommentRouter } from '../src/routes/comments.routes';
import { createResourceRouter } from '../src/routes/resource.routes';
import { createAttachmentRouter } from '../src/routes/attachments.routes';
import { createUserRouter } from '../src/routes/users.routes';
import wikiRoutes from '../src/routes/wiki.routes';
import { createProjectAnalyticsRouter } from '../src/routes/project-analytics.routes';
import { createFinancialAnalyticsRouter } from '../src/routes/financial-analytics.routes';
import { createDashboardRouter } from '../src/routes/dashboard.routes';

dotenv.config();

const app: Express = express();

// ── State ────────────────────────────────────────────────────────
let dbReady = false;
let routesMounted = false;
let startupError: string | null = null;
let initPromise: Promise<void> | null = null;

// ── CORS ─────────────────────────────────────────────────────────
const corsOriginList = (process.env.CORS_ORIGIN || '')
  .split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    if (corsOriginList.includes(origin)) return callback(null, true);
    if (
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.koyeb.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}));
app.options('*', cors());

// ── Security & body parsing ───────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check (always available, even before DB) ───────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: startupError ? 'degraded' : dbReady ? 'ok' : 'starting',
    db: dbReady ? 'connected' : startupError ? `error: ${startupError.slice(0, 80)}` : 'connecting',
    timestamp: new Date().toISOString(),
    service: 'protecht-bim-api',
    version: '0.1.0',
  });
});

app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({ name: 'PROTECHT BIM API', version: '0.1.0', status: dbReady ? 'ready' : 'starting' });
});

// ── Lazy initializer ─────────────────────────────────────────────
// Runs once per container (serverless warm instance).
async function initialize(): Promise<void> {
  if (routesMounted) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // DB
    try {
      await initializeDatabase();
      dbReady = true;
    } catch (err) {
      startupError = (err as Error).message;
      console.error('❌ DB init failed:', startupError);
      return; // Routes won't mount without DB
    }

    // Redis (optional — never fatal)
    try {
      await initializeRedis();
    } catch (err) {
      console.warn('⚠️  Redis skipped:', (err as Error).message);
    }

    // Mount all routes
    const authService = createAuthService();
    app.use('/api/v1/auth', createAuthRouter(authService));
    app.use('/api/v1', rbacRoutes);
    app.use('/api/v1/projects', createProjectRouter());
    app.use('/api/v1/work_packages', createWorkPackageRouter());
    app.use('/api/v1/work_packages', createWorkPackageRelationRouter());
    app.use('/api/v1/work_package_relations', createRelationRouter());
    app.use('/api/v1/projects', createSchedulingRouter());
    app.use('/api/v1', workCalendarRoutes);
    app.use('/api/v1', baselineRoutes);
    app.use('/api/v1', boardRoutes);
    app.use('/api/v1', sprintRoutes);
    app.use('/api/v1', burndownRoutes);
    app.use('/api/v1/icalendar', createICalendarRouter());
    app.use('/api/v1/time_entries', createTimeEntryRouter());
    app.use('/api/v1/cost-codes', createCostCodeRouter());
    app.use('/api/v1/vendors', createVendorRouter());
    app.use('/api/v1/resource-rates', createResourceRateRouter());
    app.use('/api/v1/cost-entries', createCostEntryRouter());
    app.use('/api/v1', createBudgetRouter());
    app.use('/api/v1', createActivityRouter());
    app.use('/api/v1/comments', createCommentRouter());
    app.use('/api/v1/resources', createResourceRouter());
    app.use('/api/v1/attachments', createAttachmentRouter());
    app.use('/api/v1/users', createUserRouter());
    app.use('/api/v1', wikiRoutes);
    app.use('/api/v1/projects', createProjectAnalyticsRouter());
    app.use('/api/v1/projects', createFinancialAnalyticsRouter());
    app.use('/api/v1', createDashboardRouter());

    const createAiRouter = (await import('../src/routes/ai.routes')).default;
    app.use('/api/v1/ai', createAiRouter());

    const contractRoutes    = (await import('../src/routes/contracts.routes')).default;
    const changeOrderRoutes = (await import('../src/routes/change-orders.routes')).default;
    const dailyReportRoutes = (await import('../src/routes/daily-reports.routes')).default;
    const snagRoutes        = (await import('../src/routes/snags.routes')).default;
    app.use('/api/v1/contracts',     contractRoutes);
    app.use('/api/v1/change-orders', changeOrderRoutes);
    app.use('/api/v1/daily-reports', dailyReportRoutes);
    app.use('/api/v1/snags',         snagRoutes);

    const bimRoutes = (await import('../src/routes/bim.routes')).default;
    app.use('/api/v1', bimRoutes);

    // 404
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // Error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Unhandled error:', err.message);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
      });
    });

    routesMounted = true;
    console.log('✅ All routes mounted (serverless)');
  })();

  return initPromise;
}

// ── Request handler ───────────────────────────────────────────────
// Vercel calls this export as the serverless function.
// We init lazily then hand off to Express.
const handler = async (req: Request, res: Response) => {
  await initialize().catch(err => console.error('Init error:', err));
  app(req, res);
