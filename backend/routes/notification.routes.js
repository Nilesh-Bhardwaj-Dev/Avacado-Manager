/**
 * @file notification.routes.js
 * @description Notification API routes.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../controllers/notification.controller.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/read-all', authenticate, markAllAsRead);
router.put('/:id/read', authenticate, markAsRead);

export default router;
