import { socketManager } from './websocket/socket-manager';
import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
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

// Load environment variables
dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || process.env.API_PORT || '3000', 10);

// ─── Track startup state for health check ────────────────────────
let dbReady = false;
let startupError: string | null = null;

// ─── Middleware ───────────────────────────────────────────────────
app.use(helmet());

// CORS - allow multiple origins + Vercel/Render preview domains
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',').map(o => o.trim()).filter(Boolean);
const defaultOrigins = [
  'http://localhost:3001', 'http://localhost:8081', 'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allAllowed = [...defaultOrigins, ...allowedOrigins];
    if (allAllowed.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.railway.app')) {
      return callback(null, true);
    }
    callback(new Error('CORS: Origin ' + origin + ' not allowed'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check — registered IMMEDIATELY, before DB init ───────
// Railway probes this during startup. It MUST respond as soon as the
// TCP port is open, even before the database finishes connecting.
app.get('/health', (_req: Request, res: Response) => {
  if (startupError) {
    return res.status(503).json({
      status: 'error',
      error: startupError,
      timestamp: new Date().toISOString(),
      service: 'protecht-bim-api',
    });
  }
  res.json({
    status: dbReady ? 'ok' : 'starting',
    db: dbReady ? 'connected' : 'connecting',
    timestamp: new Date().toISOString(),
    service: 'protecht-bim-api',
    version: '0.1.0',
    uptime: process.uptime(),
  });
});

// ─── API info endpoint ────────────────────────────────────────────
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    name: 'PROTECHT BIM API',
    version: '0.1.0',
    description: 'Construction Project Management Platform with BIM Integration',
    status: dbReady ? 'ready' : 'starting',
  });
});

// ─── Start server & bind port FIRST, then init DB ────────────────
const startServer = async () => {
  // Bind TCP port immediately so Railway health check can reach us
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server listening on 0.0.0.0:${port}`);
    console.log(`🏥 Health: http://localhost:${port}/health`);
    console.log(`🌍 Env: ${process.env.NODE_ENV || 'development'}`);
  });

  // Initialize WebSockets (can happen before DB)
  socketManager.initialize(server);
  console.log('🔌 WebSocket server initialized');

  // Initialize database — non-blocking for health check
  try {
    await initializeDatabase();
    dbReady = true;
    console.log('✅ Database ready');
  } catch (err) {
    startupError = (err as Error).message;
    console.error('❌ Database init failed — server still running but DB unavailable:', startupError);
    // Don't exit — let health check report the error, Railway will restart
  }

  // Initialize Redis — optional, never fatal
  try {
    await initializeRedis();
  } catch (err) {
    console.warn('⚠️  Redis unavailable, continuing without caching:', (err as Error).message);
  }

  try {
    // Initialize auth service
    const authService = createAuthService();

    // Mount all routes
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

    // Lazy-loaded enterprise routes
    const createAiRouter = (await import('./routes/ai.routes')).default;
    app.use('/api/v1/ai', createAiRouter());

    const contractRoutes  = (await import('./routes/contracts.routes')).default;
    const changeOrderRoutes = (await import('./routes/change-orders.routes')).default;
    const dailyReportRoutes = (await import('./routes/daily-reports.routes')).default;
    const snagRoutes = (await import('./routes/snags.routes')).default;
    app.use('/api/v1/contracts', contractRoutes);
    app.use('/api/v1/change-orders', changeOrderRoutes);
    app.use('/api/v1/daily-reports', dailyReportRoutes);
    app.use('/api/v1/snags', snagRoutes);

    const bimRoutes = (await import('./routes/bim.routes')).default;
    app.use('/api/v1', bimRoutes);

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });

    // Error handler
    app.use((err: Error, _req: Request, res: Response, _next: any) => {
      console.error('Error:', err);
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await closeRedis();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await closeRedis();
  process.exit(0);
});

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
