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
import { getAllTeams, createTeam, deleteTeam } from '../controllers/team.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getAllTeams);
router.post('/', createTeam);
router.delete('/:name', deleteTeam);

export default router;
