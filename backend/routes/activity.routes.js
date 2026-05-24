/**
 * @file activity.routes.js
 * @description Route definitions for the activity feed endpoint.
 * Mounted at: /api/activities
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { optionalTenantContext } from '../middleware/tenant.middleware.js';
import { getActivities, deleteActivities } from '../controllers/activity.controller.js';

const router = Router();

router.use(authenticate);
router.use(optionalTenantContext);

router.get('/', getActivities);
router.delete('/', deleteActivities);

export default router;
