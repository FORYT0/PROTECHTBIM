import { socketManager } from './websocket/socket-manager';
import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './config/data-source';
import { initializeRedis, closeRedis } from './config/redis';
import { createAuthService } from './middleware/auth.middleware';
import { createAuthRouter } from './routes/auth.routes';
import rbacRoutes from './routes/rbac.routes';
import { createProjectRouter } from './routes/projects.routes';
import { createWorkPackageRouter } from './routes/work-packages.routes';
import {
  createWorkPackageRelationRouter,
  createRelationRouter,
} from './routes/work-package-relations.routes';
import { createSchedulingRouter } from './routes/scheduling.routes';
import workCalendarRoutes from './routes/work-calendars.routes';
import baselineRoutes from './routes/baselines.routes';
import boardRoutes from './routes/boards.routes';
import sprintRoutes from './routes/sprints.routes';
import burndownRoutes from './routes/burndown.routes';
import { createICalendarRouter } from './routes/icalendar.routes';
import { createTimeEntryRouter } from './routes/time-entries.routes';
import { createCostEntryRouter } from './routes/cost-entries.routes';
import { createCostCodeRouter } from './routes/cost-codes.routes';
import { createVendorRouter } from './routes/vendors.routes';
import { createResourceRateRouter } from './routes/resource-rates.routes';
import { createBudgetRouter } from './routes/budgets.routes';
import { createActivityRouter } from './routes/activity.routes';
import { createCommentRouter } from './routes/comments.routes';
import { createResourceRouter } from './routes/resource.routes';
import { createAttachmentRouter } from './routes/attachments.routes';
import { createUserRouter } from './routes/users.routes';
import wikiRoutes from './routes/wiki.routes';
import { createProjectAnalyticsRouter } from './routes/project-analytics.routes';
import { createFinancialAnalyticsRouter } from './routes/financial-analytics.routes';
import { createDashboardRouter } from './routes/dashboard.routes';

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || process.env.API_PORT || '3000', 10);

let dbReady = false;
let startupError: string | null = null;

// ─── CORS ─────────────────────────────────────────────────────────
// MUST be the very first middleware so OPTIONS preflight gets headers
// before anything else (including helmet) touches the response.
// 
// Strategy: allow ALL origins in development; in production allow
// localhost + any *.vercel.app + any explicit CORS_ORIGIN list.
// We NEVER throw on unknown origins — we just omit the header so the
// browser's same-origin check rejects it naturally (no 500/503).
const corsOriginList = (process.env.CORS_ORIGIN || '')
  .split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // No origin = server-to-server / curl / mobile — always allow
    if (!origin) return callback(null, true);
    // Development — allow everything
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // Localhost variations
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    // Explicit allowlist from env
    if (corsOriginList.includes(origin)) return callback(null, true);
    // Wildcard cloud preview domains
    if (
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.railway.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }
    // Unknown origin — pass null (not an error!) which omits the header.
    // The browser will block it, but we won't crash with a 500.
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // IE11 sends preflight expecting 200 not 204
}));

// Handle OPTIONS preflight explicitly — always respond 200
app.options('*', cors());

// ─── Security & body parsing ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────
// Must be registered BEFORE startServer() so Railway can probe the
// port the moment it opens — before DB connects.
app.get('/health', (_req: Request, res: Response) => {
  // Always return 200 — a non-200 causes Railway to restart the container.
  // Report db state in the body so we can debug without restarting.
  res.status(200).json({
    status: startupError ? 'degraded' : dbReady ? 'ok' : 'starting',
    db: dbReady ? 'connected' : startupError ? `error: ${startupError.slice(0, 80)}` : 'connecting',
    timestamp: new Date().toISOString(),
    service: 'protecht-bim-api',
    version: '0.1.0',
    uptime: process.uptime(),
  });
});

app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    name: 'PROTECHT BIM API',
    version: '0.1.0',
    description: 'Construction Project Management Platform with BIM Integration',
    status: dbReady ? 'ready' : 'starting',
  });
});

// ─── Start server ─────────────────────────────────────────────────
const startServer = async () => {
  // 1. Bind port FIRST — Railway health check probes immediately
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server listening on 0.0.0.0:${port}`);
    console.log(`🏥 Health: http://localhost:${port}/health`);
    console.log(`🌍 Env: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 CORS origins: ${corsOriginList.length ? corsOriginList.join(', ') : '(wildcard *.vercel.app)'}`);
  });

  // 2. WebSockets — before DB (doesn't need it)
  socketManager.initialize(server);
  console.log('🔌 WebSocket initialized');

  // 3. Database — async, non-fatal to health check
  try {
    await initializeDatabase();
    dbReady = true;
    startupError = null;
    console.log('✅ Database connected');
  } catch (err) {
    startupError = (err as Error).message;
    console.error('❌ DB failed (health returns degraded, not restarting):', startupError);
  }

  // 4. Redis — optional, never fatal
  try {
    await initializeRedis();
  } catch (err) {
    console.warn('⚠️  Redis skipped:', (err as Error).message);
  }

  // 5. Mount all routes
  try {
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

    const createAiRouter = (await import('./routes/ai.routes')).default;
    app.use('/api/v1/ai', createAiRouter());

    const contractRoutes    = (await import('./routes/contracts.routes')).default;
    const changeOrderRoutes = (await import('./routes/change-orders.routes')).default;
    const dailyReportRoutes = (await import('./routes/daily-reports.routes')).default;
    const snagRoutes        = (await import('./routes/snags.routes')).default;
    app.use('/api/v1/contracts',     contractRoutes);
    app.use('/api/v1/change-orders', changeOrderRoutes);
    app.use('/api/v1/daily-reports', dailyReportRoutes);
    app.use('/api/v1/snags',         snagRoutes);

    const bimRoutes = (await import('./routes/bim.routes')).default;
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

    console.log('✅ All routes mounted');
  } catch (error) {
    console.error('Failed to mount routes:', error);
  }
};

process.on('SIGTERM', async () => { await closeRedis(); process.exit(0); });
process.on('SIGINT',  async () => { await closeRedis(); process.exit(0); });

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
