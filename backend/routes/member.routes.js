/**
 * @file member.routes.js
 * @description Route definitions for workspace member management.
 * Mounted at: /api/members
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  getAllMembers,
  addMember,
  removeMember,
  bulkDeleteMembers,
  toggleMemberStatus,
  setMemberCredentials,
} from '../controllers/member.controller.js';

const router = Router();

// Standard member CRUD (admin + superadmin)
const adminGuard = [authenticate, requireRole('superadmin', 'admin')];

router.get('/', ...adminGuard, getAllMembers);
router.post('/', ...adminGuard, addMember);
router.delete('/:id', ...adminGuard, removeMember);
router.post('/bulk-delete', ...adminGuard, bulkDeleteMembers);

// Member status and credentials management
router.put('/:id/status', ...adminGuard, toggleMemberStatus);
router.put('/:id/credentials', ...adminGuard, setMemberCredentials);

export default router;
