/**
 * @file superadmin.routes.js
 * @description Route definitions for Super Admin management endpoints.
 * Mounted at: /api/superadmin
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  getDashboardStats,
  listAdmins,
  createAdmin,
  updateAdmin,
  updateAdminPermissions,
  deleteAdmin,
  listAllUsers,
  resetPassword,
  toggleStatus,
  getAuditLogs,
  clearAuditLogs,
  listOrganizations,
  listOrganizationUsers,
  toggleOrganizationStatus,
} from '../controllers/superadmin.controller.js';
import { listOtpLogs, sendOtp } from '../controllers/otp.controller.js';
import {
  listAllQueries,
  getQueryStats,
  updateQuery,
} from '../controllers/query.controller.js';
import {
  listSecurityAuditLogs,
  listLoginHistory,
} from '../controllers/securityAudit.controller.js';

const router = Router();

// All superadmin routes require authentication + superadmin role
const guard = [authenticate, requireRole('superadmin')];

// Dashboard
router.get('/stats', ...guard, getDashboardStats);

// Admin CRUD
router.get('/admins', ...guard, listAdmins);
router.post('/admins', ...guard, createAdmin);
router.put('/admins/:id/reset-password', ...guard, resetPassword);
router.put('/admins/:id/status', ...guard, toggleStatus);
router.put('/admins/:id/permissions', ...guard, updateAdminPermissions);
router.put('/admins/:id', ...guard, updateAdmin);
router.delete('/admins/:id', ...guard, deleteAdmin);

// User listing (all users across all orgs)
router.get('/users', ...guard, listAllUsers);
router.put('/users/:id/reset-password', ...guard, resetPassword);
router.put('/users/:id/status', ...guard, toggleStatus);

// Organizations management
router.get('/organizations', ...guard, listOrganizations);
router.get('/organizations/:orgId/users', ...guard, listOrganizationUsers);
router.put('/organizations/:orgId/status', ...guard, toggleOrganizationStatus);

// Legacy flat paths (kept for backward compatibility)
router.put('/reset-password/:id', ...guard, resetPassword);
router.put('/toggle-status/:id', ...guard, toggleStatus);

// OTP management
router.get('/otp/logs', ...guard, listOtpLogs);
router.post('/otp/send', ...guard, sendOtp);

// Query management
router.get('/queries/stats', ...guard, getQueryStats);
router.get('/queries', ...guard, listAllQueries);
router.put('/queries/:id', ...guard, updateQuery);

// Workspace activity audit
router.get('/audit-logs', ...guard, getAuditLogs);
router.delete('/audit-logs', ...guard, clearAuditLogs);

// Security audit logs
router.get('/security-audit', ...guard, listSecurityAuditLogs);
router.get('/login-history', ...guard, listLoginHistory);

export default router;
