/**
 * @file project.routes.js
 */
import { Router } from 'express';
import { resolveTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import * as projectCtrl from '../controllers/project.controller.js';

const router = Router({ mergeParams: true });

router.get('/', projectCtrl.listProjects);
router.post('/', requirePermission(Permission.CREATE_PROJECT), projectCtrl.createProject);

router.use('/:projectId', resolveTenantContext({ requireProject: true }));

router.get('/:projectId', projectCtrl.getProject);
router.patch('/:projectId', requirePermission(Permission.EDIT_PROJECT), projectCtrl.updateProject);
router.delete('/:projectId', requirePermission(Permission.DELETE_PROJECT), projectCtrl.deleteProject);

router.get('/:projectId/members', projectCtrl.listProjectMembers);
router.patch(
  '/:projectId/members/:userId',
  requirePermission(Permission.MANAGE_ROLES),
  projectCtrl.updateProjectMemberRole
);
router.delete(
  '/:projectId/members/:userId',
  requirePermission(Permission.MANAGE_ROLES),
  projectCtrl.removeProjectMember
);

export default router;
