/**
 * @file role.middleware.js
 * @description Role-based authorization middleware.
 */
import { hasAccountRole, hasMinimumRole, normalizeAccountRole } from '../constants/roles.js';

/**
 * Restrict access to specific account roles.
 * @param  {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    if (!hasAccountRole(req.user.accountRole, allowedRoles)) {
      return res.status(403).json({
        error: `Forbidden: Requires one of: ${allowedRoles.join(', ')}.`,
      });
    }
    next();
  };
}

/**
 * Require minimum role level in hierarchy.
 * @param {string} minimumRole
 */
export function requireMinimumRole(minimumRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    if (!hasMinimumRole(req.user.accountRole, minimumRole)) {
      return res.status(403).json({
        error: `Forbidden: Requires ${normalizeAccountRole(minimumRole)} role or higher.`,
      });
    }
    next();
  };
}
