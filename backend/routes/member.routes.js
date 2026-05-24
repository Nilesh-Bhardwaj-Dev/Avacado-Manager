/**
 * @file member.routes.js
 * @description Route definitions for workspace member management.
 * Mounted at: /api/members
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { optionalTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  getAllMembers,
  addMember,
  removeMember,
  bulkDeleteMembers,
  toggleMemberStatus,
  setMemberCredentials,
} from '../controllers/member.controller.js';

const router = Router();

router.use(authenticate);
router.use(optionalTenantContext);

const canInvite = (req, res, next) => {
  if (!req.context?.organizationId) {
    return requireRole('superadmin', 'admin')(req, res, next);
  }
  return requirePermission(Permission.INVITE_USER)(req, res, next);
};

const canManageRoles = (req, res, next) => {
  if (!req.context?.organizationId) {
    return requireRole('superadmin', 'admin')(req, res, next);
  }
  return requirePermission(Permission.MANAGE_ROLES)(req, res, next);
};

const canViewMembers = (req, res, next) => {
  if (!req.context?.organizationId) {
    return requireRole('superadmin', 'admin')(req, res, next);
  }
  next();
};

router.get('/', canViewMembers, getAllMembers);
router.post('/', canInvite, addMember);
router.delete('/:id', canManageRoles, removeMember);
router.post('/bulk-delete', canManageRoles, bulkDeleteMembers);

// Member status and credentials management
router.put('/:id/status', canManageRoles, toggleMemberStatus);
router.put('/:id/credentials', canManageRoles, setMemberCredentials);

export default router;
