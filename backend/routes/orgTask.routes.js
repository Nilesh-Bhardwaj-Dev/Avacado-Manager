/**
 * @file orgTask.routes.js
 */
import { Router } from 'express';
import { resolveTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import * as taskCtrl from '../controllers/orgTask.controller.js';

const router = Router({ mergeParams: true });

router.use(resolveTenantContext({ requireProject: true }));

router.get('/', taskCtrl.getProjectTasks);
router.post('/', requirePermission(Permission.CREATE_TASK), taskCtrl.createProjectTask);
router.put('/:id', requirePermission(Permission.EDIT_TASK), taskCtrl.updateProjectTask);
router.delete('/:id', requirePermission(Permission.DELETE_TASK), taskCtrl.deleteProjectTask);

export default router;
