/**
 * @file orgTeam.routes.js
 */
import { Router } from 'express';
import { requirePermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import * as teamCtrl from '../controllers/orgTeam.controller.js';

const router = Router({ mergeParams: true });

router.get('/', teamCtrl.listTeams);
router.post('/', requirePermission(Permission.EDIT_PROJECT), teamCtrl.createTeam);
router.patch('/:teamId', requirePermission(Permission.EDIT_PROJECT), teamCtrl.updateTeam);
router.delete('/:teamId', requirePermission(Permission.EDIT_PROJECT), teamCtrl.deleteTeam);

export default router;
