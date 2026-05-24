/**
 * @file task.routes.js
 * @description Route definitions for task, subtask, and comment endpoints.
 * All business logic is delegated to task.controller.js.
 *
 * Mounted at: /api/tasks
 * All routes require authentication via the `authenticate` middleware.
 *
 * GET    /api/tasks
 * POST   /api/tasks
 * PUT    /api/tasks/:id
 * DELETE /api/tasks/:id
 *
 * POST   /api/tasks/:id/subtasks
 * PUT    /api/tasks/:taskId/subtasks/:id
 * DELETE /api/tasks/:taskId/subtasks/:id
 *
 * POST   /api/tasks/:id/comments
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { optionalTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  addComment,
  uploadProof,
} from '../controllers/task.controller.js';

const router = Router();

// Apply authentication and optional tenant context to all task routes
router.use(authenticate);
router.use(optionalTenantContext);

// Task CRUD
router.get('/', getAllTasks);
router.post('/', requirePermission(Permission.CREATE_TASK), createTask);
router.put('/:id', requirePermission(Permission.EDIT_TASK), updateTask);
router.delete('/:id', requirePermission(Permission.DELETE_TASK), deleteTask);

// Subtasks (nested under a task)
router.post('/:id/subtasks', requirePermission(Permission.EDIT_TASK), addSubtask);
router.put('/:taskId/subtasks/:id', requirePermission(Permission.EDIT_TASK), updateSubtask);
router.delete('/:taskId/subtasks/:id', requirePermission(Permission.EDIT_TASK), deleteSubtask);

// Comments (nested under a task)
router.post('/:id/comments', addComment);

// Proof / deliverables upload (nested under a task)
router.post('/:id/proof', uploadProof);

export default router;
