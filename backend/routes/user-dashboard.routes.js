/**
 * @file user-dashboard.routes.js
 * @description Routes for the team-member (user) dashboard.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { optionalTenantContext } from '../middleware/tenant.middleware.js';
import {
  getMyTasks,
  updateMyTaskStatus,
  getMyStats
} from '../controllers/user-dashboard.controller.js';

const router = Router();

router.use(authenticate);
router.use(optionalTenantContext);

router.get('/tasks', getMyTasks);
router.put('/tasks/:id/status', updateMyTaskStatus);
router.get('/stats', getMyStats);

export default router;
