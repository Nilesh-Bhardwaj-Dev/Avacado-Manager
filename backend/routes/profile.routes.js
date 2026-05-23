/**
 * @file profile.routes.js
 * @description Route definitions for profile management.
 * Mounted at: /api/profile
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getProfile,
  updateProfile,
  updatePassword,
} from '../controllers/profile.controller.js';

const router = Router();

router.get('/', authenticate, getProfile);
router.put('/', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);

export default router;
