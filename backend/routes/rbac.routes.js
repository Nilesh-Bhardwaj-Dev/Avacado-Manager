/**
 * @file rbac.routes.js
 */
import { Router } from 'express';
import { requireAnyPermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import * as rbacCtrl from '../controllers/rbac.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAnyPermission(Permission.MANAGE_ROLES, Permission.MANAGE_ORGANIZATION),
  rbacCtrl.listRoles
);
router.post('/', requireAnyPermission(Permission.MANAGE_ROLES), rbacCtrl.createCustomRole);
router.patch('/:roleId', requireAnyPermission(Permission.MANAGE_ROLES), rbacCtrl.updateRole);
router.delete('/:roleId', requireAnyPermission(Permission.MANAGE_ROLES), rbacCtrl.deleteRole);

export default router;
