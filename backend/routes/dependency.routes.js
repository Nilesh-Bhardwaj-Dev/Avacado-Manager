/**
 * @file dependency.routes.js
 * @description Task dependency API routes (mounted under /api/tasks).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  addDependency,
  removeDependency,
  getDependencies
} from '../controllers/dependency.controller.js';

const router = Router();

router.post('/:id/dependencies', authenticate, addDependency);
router.delete('/:id/dependencies/:depId', authenticate, removeDependency);
router.get('/:id/dependencies', authenticate, getDependencies);

export default router;
