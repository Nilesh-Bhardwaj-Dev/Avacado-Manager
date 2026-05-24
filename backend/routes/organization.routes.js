/**
 * @file organization.routes.js
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { resolveTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import * as orgCtrl from '../controllers/organization.controller.js';
import projectRoutes from './project.routes.js';
import rbacRoutes from './rbac.routes.js';
import orgTeamRoutes from './orgTeam.routes.js';
import orgTaskRoutes from './orgTask.routes.js';

const router = Router();

router.use(authenticate);

router.get('/', orgCtrl.listOrganizations);
router.post('/', orgCtrl.createOrganization);

router.use('/:orgId', resolveTenantContext());

router.get('/:orgId', orgCtrl.getOrganization);
router.patch('/:orgId', requirePermission(Permission.MANAGE_ORGANIZATION), orgCtrl.updateOrganization);
router.delete('/:orgId', requireRole('superadmin'), orgCtrl.deleteOrganization);

router.get('/:orgId/me/permissions', orgCtrl.getMyPermissions);
router.get('/:orgId/audit-logs', requirePermission(Permission.VIEW_AUDIT_LOGS), orgCtrl.getAuditLogs);

router.get('/:orgId/members', orgCtrl.listMembers);
router.post('/:orgId/members/invite', requirePermission(Permission.INVITE_USER), orgCtrl.inviteMember);
router.patch(
  '/:orgId/members/:userId',
  requirePermission(Permission.MANAGE_ROLES),
  orgCtrl.updateMemberRole
);
router.delete(
  '/:orgId/members/:userId',
  requirePermission(Permission.MANAGE_ROLES),
  orgCtrl.removeMember
);

router.use('/:orgId/projects', projectRoutes);
router.use('/:orgId/roles', rbacRoutes);
router.use('/:orgId/teams', orgTeamRoutes);
router.use('/:orgId/projects/:projectId/tasks', orgTaskRoutes);

export default router;
