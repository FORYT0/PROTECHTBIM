import { socketManager } from './websocket/socket-manager';
import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './config/data-source';
import { initializeRedis, closeRedis } from './config/redis';
// import { createSessionMiddleware } from './config/session';
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
const port = process.env.API_PORT || 3000;

// Middleware
app.use(helmet());

// CORS configuration - handle multiple origins properly
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3001', 'http://localhost:8081'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware will be added after Redis initialization

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'protecht-bim-api',
      version: '0.1.0',
      uptime: process.uptime(),
    };
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'protecht-bim-api',
    });
  }
});

// API version endpoint
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    name: 'PROTECHT BIM API',
    version: '0.1.0',
    description: 'Construction Project Management Platform with BIM Integration',
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Initialize Redis connection
    await initializeRedis();

    // Add session middleware after Redis is initialized
    // TODO: Fix connect-redis compatibility issue
    // app.use(createSessionMiddleware());

    // Initialize auth service
    const authService = createAuthService();

    // Mount authentication routes
    app.use('/api/v1/auth', createAuthRouter(authService));

    // Mount RBAC routes
    app.use('/api/v1', rbacRoutes);

    // Mount project routes
    app.use('/api/v1/projects', createProjectRouter());

    // Mount work package routes
    app.use('/api/v1/work_packages', createWorkPackageRouter());

    // Mount work package relation routes (nested under work packages)
    app.use('/api/v1/work_packages', createWorkPackageRelationRouter());

    // Mount standalone relation routes
    app.use('/api/v1/work_package_relations', createRelationRouter());

    // Mount scheduling routes
    app.use('/api/v1/projects', createSchedulingRouter());

    // Mount work calendar routes
    app.use('/api/v1', workCalendarRoutes);

    // Mount baseline routes
    app.use('/api/v1', baselineRoutes);

    // Mount board routes
    app.use('/api/v1', boardRoutes);

    // Mount sprint routes
    app.use('/api/v1', sprintRoutes);

    // Mount burndown routes
    app.use('/api/v1', burndownRoutes);

    // Mount iCalendar routes
    app.use('/api/v1/icalendar', createICalendarRouter());

    // Mount time entry routes
    app.use('/api/v1/time_entries', createTimeEntryRouter());

    // Mount cost code routes
    app.use('/api/v1/cost-codes', createCostCodeRouter());

    // Mount vendor routes
    app.use('/api/v1/vendors', createVendorRouter());

    // Mount resource rate routes
    app.use('/api/v1/resource-rates', createResourceRateRouter());

    // Mount cost entry routes
    app.use('/api/v1/cost-entries', createCostEntryRouter());

    // Mount budget routes
    app.use('/api/v1', createBudgetRouter());

    // Mount activity routes
    app.use('/api/v1', createActivityRouter());

    // Mount comment routes
    app.use('/api/v1/comments', createCommentRouter());

    // Mount resource routes
    app.use('/api/v1/resources', createResourceRouter());

    // Mount attachment routes
    app.use('/api/v1/attachments', createAttachmentRouter());

    // Mount user routes
    app.use('/api/v1/users', createUserRouter());

    // Mount wiki routes
    app.use('/api/v1', wikiRoutes);

    // Mount project analytics routes
    app.use('/api/v1/projects', createProjectAnalyticsRouter());

    // Mount financial analytics routes
    app.use('/api/v1/projects', createFinancialAnalyticsRouter());

    // ✅ Mount unified dashboard routes
    app.use('/api/v1', createDashboardRouter());

    // Mount AI routes
    const createAiRouter = (await import('./routes/ai.routes')).default;
    app.use('/api/v1/ai', createAiRouter());

    // Mount enterprise construction routes
    const contractRoutes = (await import('./routes/contracts.routes')).default;
    const changeOrderRoutes = (await import('./routes/change-orders.routes')).default;
    const dailyReportRoutes = (await import('./routes/daily-reports.routes')).default;
    const snagRoutes = (await import('./routes/snags.routes')).default;
    
    app.use('/api/v1/contracts', contractRoutes);
    app.use('/api/v1/change-orders', changeOrderRoutes);
    app.use('/api/v1/daily-reports', dailyReportRoutes);
    app.use('/api/v1/snags', snagRoutes);

    // Mount BIM routes
    const bimRoutes = (await import('./routes/bim.routes')).default;
    app.use('/api/v1', bimRoutes);

    // Serve frontend static files in production (monorepo: web build is at apps/web/dist)
    if (process.env.NODE_ENV === 'production') {
      const webDistPath = path.resolve(__dirname, '../../web/dist');
      app.use(express.static(webDistPath));
      // SPA fallback — must come AFTER all API routes
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(webDistPath, 'index.html'));
      });
    }

    // 404 handler - MUST be after all routes
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });

    // Error handler - MUST be last
    app.use((err: Error, _req: Request, res: Response, _next: any) => {
      console.error('Error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
      });
    });

    // Start Express server
    const server = app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
      console.log(`📚 API documentation: http://localhost:${port}/api/v1`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${port}/api/v1/auth`);
      console.log(`🔑 RBAC endpoints: http://localhost:${port}/api/v1/roles, /api/v1/permissions`);
      console.log(`📁 Project endpoints: http://localhost:${port}/api/v1/projects`);
      console.log(`📦 Work Package endpoints: http://localhost:${port}/api/v1/work_packages`);
      console.log(`🔗 Work Package Relations: http://localhost:${port}/api/v1/work_packages/:id/relations`);
      console.log(`📅 Scheduling endpoints: http://localhost:${port}/api/v1/projects/:id/scheduling`);
      console.log(`📆 Work Calendar endpoints: http://localhost:${port}/api/v1/calendars, /api/v1/projects/:id/calendar`);
      console.log(`📊 Baseline endpoints: http://localhost:${port}/api/v1/projects/:id/baselines, /api/v1/baselines/:id`);
      console.log(`📋 Board endpoints: http://localhost:${port}/api/v1/projects/:id/boards, /api/v1/boards/:id`);
      console.log(`🏃 Sprint endpoints: http://localhost:${port}/api/v1/projects/:id/sprints, /api/v1/sprints/:id`);
      console.log(`📉 Burndown endpoints: http://localhost:${port}/api/v1/sprints/:id/burndown, /api/v1/projects/:id/burndown`);
      console.log(`📅 iCalendar endpoints: http://localhost:${port}/api/v1/icalendar/projects/:id, /api/v1/icalendar/users/me`);
      console.log(`⏱️  Time Entry endpoints: http://localhost:${port}/api/v1/time_entries`);
      console.log(`💰 Cost Entry endpoints: http://localhost:${port}/api/v1/cost_entries`);
      console.log(`📊 Activity endpoints: http://localhost:${port}/api/v1/projects/:projectId/activity, /api/v1/activity/feed, /api/v1/activity/filters`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Initialize WebSockets
    socketManager.initialize(server);
    console.log(`🔌 WebSocket server initialized`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeRedis();
  process.exit(0);
});

// Start the server
startServer();
