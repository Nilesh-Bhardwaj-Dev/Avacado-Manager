/**
 * @file app.js
 * @description Express application factory with production security middleware.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authConfig } from './config/auth.config.js';

import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import teamRoutes from './routes/team.routes.js';
import memberRoutes from './routes/member.routes.js';
import activityRoutes from './routes/activity.routes.js';
import profileRoutes from './routes/profile.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dependencyRoutes from './routes/dependency.routes.js';
import userDashboardRoutes from './routes/user-dashboard.routes.js';
import queryRoutes from './routes/query.routes.js';

import { errorHandler } from './middleware/error.middleware.js';
import { sanitizeInputs } from './middleware/sanitize.middleware.js';
import { globalRateLimiter } from './middleware/rateLimit.middleware.js';
import { csrfProtection } from './middleware/csrf.middleware.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: authConfig.isProduction ? undefined : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || authConfig.cors.origin.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: authConfig.cors.credentials,
}));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInputs);
app.use(globalRateLimiter);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// CSRF for state-changing API routes (except public auth endpoints)
app.use('/api', (req, res, next) => {
  const publicPaths = [
    '/auth/login',
    '/auth/refresh',
    '/auth/session',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/2fa/verify-login',
  ];
  const path = req.path.replace(/\/$/, '');
  if (publicPaths.some((p) => path === p || path.endsWith(p))) {
    return next();
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', dependencyRoutes);
app.use('/api/user', userDashboardRoutes);
app.use('/api/queries', queryRoutes);

const distPath = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'Backend running',
      message: 'Frontend not built yet. Run: npm run build',
    });
  });
}

app.use(errorHandler);

logger.info('Express app configured', { env: authConfig.nodeEnv });

export default app;
