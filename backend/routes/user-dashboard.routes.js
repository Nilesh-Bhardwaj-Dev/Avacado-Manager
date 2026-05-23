/**
 * @file user-dashboard.routes.js
 * @description Routes for the team-member (user) dashboard.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMyTasks,
  updateMyTaskStatus,
  getMyStats
} from '../controllers/user-dashboard.controller.js';

const router = Router();

router.get('/tasks', authenticate, getMyTasks);
router.put('/tasks/:id/status', authenticate, updateMyTaskStatus);
router.get('/stats', authenticate, getMyStats);

export default router;
