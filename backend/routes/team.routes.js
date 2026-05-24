/**
 * @file team.routes.js
 * @description Route definitions for team management endpoints.
 * All business logic is delegated to team.controller.js.
 *
 * Mounted at: /api/teams
 * All routes require authentication via the `authenticate` middleware.
 *
 * GET    /api/teams           — list all team names
 * POST   /api/teams           — create a new team
 * DELETE /api/teams/:name     — delete a team (rejects if members still assigned)
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { optionalTenantContext } from '../middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { Permission } from '../constants/permissions.js';
import { requireRole } from '../middleware/role.middleware.js';
import { getAllTeams, createTeam, deleteTeam } from '../controllers/team.controller.js';

const router = Router();

router.use(authenticate);
router.use(optionalTenantContext);

const canManageTeams = (req, res, next) => {
  if (!req.context?.organizationId) {
    return requireRole('superadmin', 'admin')(req, res, next);
  }
  return requirePermission(Permission.EDIT_PROJECT)(req, res, next);
};

router.get('/', getAllTeams);
router.post('/', canManageTeams, createTeam);
router.delete('/:name', canManageTeams, deleteTeam);

export default router;
