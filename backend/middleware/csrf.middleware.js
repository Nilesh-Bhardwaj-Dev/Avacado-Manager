/**
 * @file csrf.middleware.js
 * @description Double-submit cookie CSRF protection for cookie-based auth.
 */
import { authConfig } from '../config/auth.config.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Validates X-CSRF-Token header against csrf_token cookie.
 */
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[authConfig.cookies.csrfName];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }
  next();
}
