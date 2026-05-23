/**
 * @file activity.routes.js
 * @description Route definitions for the activity feed endpoint.
 * Mounted at: /api/activities
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getActivities, deleteActivities } from '../controllers/activity.controller.js';

const router = Router();

router.get('/', authenticate, getActivities);
router.delete('/', authenticate, deleteActivities);

export default router;
