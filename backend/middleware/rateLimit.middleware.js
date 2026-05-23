/**
 * @file rateLimit.middleware.js
 * @description API rate limiting.
 */
import rateLimit from 'express-rate-limit';
import { authConfig } from '../config/auth.config.js';

export const globalRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: authConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

export const authRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: authConfig.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  skipSuccessfulRequests: true,
});
