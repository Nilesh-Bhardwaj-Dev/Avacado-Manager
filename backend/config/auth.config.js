/**
 * @file auth.config.js
 * @description Centralized authentication configuration from environment variables.
 */
import crypto from 'crypto';

function requireEnv(name, fallback = null) {
  const value = process.env[name] ?? fallback;
  if (value === null || value === undefined || value === '') {
    throw new Error(`[Auth] Missing required environment variable: ${name}`);
  }
  return value;
}

function parseDurationMs(value, fallbackMs) {
  if (!value) return fallbackMs;
  const match = String(value).trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * (multipliers[unit] || 1000);
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

export const authConfig = {
  nodeEnv,
  isProduction,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  appName: process.env.APP_NAME || 'Task Manager',

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET', crypto.randomBytes(64).toString('hex')),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', crypto.randomBytes(64).toString('hex')),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    accessExpiresMs: parseDurationMs(process.env.JWT_ACCESS_EXPIRES_IN, 15 * 60_000),
    refreshExpiresMs: parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN, 30 * 86_400_000),
    issuer: process.env.JWT_ISSUER || 'task-management-saas',
    audience: process.env.JWT_AUDIENCE || 'task-management-api',
    temp2faExpiresIn: '5m',
  },

  cookies: {
    accessName: 'access_token',
    refreshName: 'refresh_token',
    csrfName: 'csrf_token',
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  },

  security: {
    maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS || 5),
    lockoutMinutes: Number(process.env.LOCKOUT_MINUTES || 15),
    bcryptRounds: undefined, // using Argon2
    passwordHistoryCount: Number(process.env.PASSWORD_HISTORY_COUNT || 5),
    refreshTokenBytes: 48,
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.APP_URL,
    ].filter(Boolean),
    credentials: true,
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60_000),
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  },
};

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn(
    '[Auth] JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are not set. Using ephemeral secrets — sessions will not survive restarts.'
  );
}
