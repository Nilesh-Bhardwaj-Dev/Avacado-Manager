/**
 * @file dependency.routes.js
 * @description Task dependency API routes (mounted under /api/tasks).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { optionalTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import {
  addDependency,
  removeDependency,
  getDependencies
} from '../controllers/dependency.controller.js';

const router = Router();

router.use(authenticate);
router.use(optionalTenantContext);

router.post('/:id/dependencies', requirePermission(Permission.EDIT_TASK), addDependency);
router.delete('/:id/dependencies/:depId', requirePermission(Permission.EDIT_TASK), removeDependency);
router.get('/:id/dependencies', getDependencies);

export default router;
