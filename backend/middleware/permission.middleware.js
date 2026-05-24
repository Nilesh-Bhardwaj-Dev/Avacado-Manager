/**
 * @file permission.middleware.js
 * @description Permission-based authorization guards.
 */
import { hasPermission, hasAnyPermission } from '../services/rbac.service.js';
import { writeRbacAuditLog } from '../services/rbacAudit.service.js';

async function checkAndDeny(req, res, checkFn) {
  const allowed = await checkFn();
  if (allowed) return true;

  await writeRbacAuditLog({
    organizationId: req.context?.organizationId || null,
    projectId: req.context?.projectId || null,
    actorId: req.user?.id,
    action: 'PERMISSION_DENIED',
    metadata: { path: req.path, method: req.method },
    req,
  }).catch(() => {});

  res.status(403).json({ error: 'Forbidden: insufficient permissions.' });
  return false;
}

/**
 * @param  {...string} permissions
 */
export function requirePermission(...permissions) {
  return async (req, res, next) => {
    try {
      const ok = await checkAndDeny(req, res, () =>
        hasPermission(req.user, permissions, req.context || {})
      );
      if (ok) next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * @param  {...string} permissions
 */
export function requireAnyPermission(...permissions) {
  return async (req, res, next) => {
    try {
      const ok = await checkAndDeny(req, res, () =>
        hasAnyPermission(req.user, permissions, req.context || {})
      );
      if (ok) next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * @param  {...string} permissions
 */
export function requireAllPermissions(...permissions) {
  return requirePermission(...permissions);
}
