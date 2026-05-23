/**
 * @file query.routes.js
 * @description Raise Query routes for admins and users.
 * Mounted at: /api/queries
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  createQuery,
  listMyQueries,
  getMyQuery,
} from '../controllers/query.controller.js';

const router = Router();

const guard = [authenticate, requireRole('admin', 'user')];

router.post('/', ...guard, createQuery);
router.get('/', ...guard, listMyQueries);
router.get('/:id', ...guard, getMyQuery);

export default router;
