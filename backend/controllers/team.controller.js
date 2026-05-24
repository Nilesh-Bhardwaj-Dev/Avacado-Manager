/**
 * @file team.controller.js
 * @description Business logic for team management.
 * Exports: getAllTeams, createTeam, deleteTeam
 */
import { getDB } from '../config/db.js';
import { logActivity } from '../utils/activity.util.js';
import { OrgTeamModel } from '../models/OrgTeam.model.js';

/**
 * GET /api/teams
 * Returns a sorted list of all team names.
 */
export async function getAllTeams(req, res, next) {
  try {
    const db = getDB();
    if (req.context?.organizationId) {
      const filter = { organizationId: req.context.organizationId };
      if (req.context.projectId) filter.projectId = req.context.projectId;
      const teams = await OrgTeamModel.find(filter).sort({ name: 1 }).lean();
      return res.json(teams.map((t) => t.name));
    }
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : (req.user.accountRole === 'user' ? req.user.managedBy : null);
    const query = ownerId ? { ownerId } : {};
    const teams = await db.collection('teams').find(query).sort({ name: 1 }).toArray();
    res.json(teams.map((t) => t.name));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/teams
 * Creates a new team. Rejects duplicate names.
 */
export async function createTeam(req, res, next) {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required.' });
    }

    const cleanName = name.trim();

    if (req.context?.organizationId) {
      const filter = { organizationId: req.context.organizationId, name: cleanName };
      const exists = await OrgTeamModel.findOne(filter);
      if (exists) {
        return res.status(409).json({ error: `Team '${cleanName}' already exists.` });
      }

      await OrgTeamModel.create({
        organizationId: req.context.organizationId,
        projectId: req.context.projectId || null,
        name: cleanName,
        memberIds: [],
        leadUserId: null,
      });

      return res.status(201).json({ name: cleanName });
    }

    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;

    const exists = await db.collection('teams').findOne({ name: cleanName, ownerId });
    if (exists) {
      return res.status(409).json({ error: `Team '${cleanName}' already exists.` });
    }

    await db.collection('teams').insertOne({ name: cleanName, ownerId });
    await logActivity(`${req.user.name} created team '${cleanName}'`, ownerId);

    res.status(201).json({ name: cleanName });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/teams/:name
 * Deletes a team by name. Blocks deletion if workspace directory members
 * (password: null) are still assigned to this team.
 * Tasks belonging to the team are unassigned before deletion.
 */
export async function deleteTeam(req, res, next) {
  try {
    const teamName = decodeURIComponent(req.params.name);
    const db = getDB();

    if (req.context?.organizationId) {
      const team = await OrgTeamModel.findOne({ name: teamName, organizationId: req.context.organizationId });
      if (!team) {
        return res.status(404).json({ error: `Team '${teamName}' not found.` });
      }

      const memberCount = await db.collection('users').countDocuments({
        team: teamName,
        defaultOrganizationId: req.context.organizationId,
      });

      if (memberCount > 0) {
        return res.status(400).json({
          error: `Cannot delete '${teamName}' — ${memberCount} member(s) are still assigned to it. Reassign or remove them first.`,
        });
      }

      await db.collection('tasks').updateMany(
        { team: teamName, organizationId: req.context.organizationId },
        { $set: { team: 'Unassigned' } }
      );

      await OrgTeamModel.deleteOne({ name: teamName, organizationId: req.context.organizationId });
      return res.json({ success: true });
    }

    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    const team = await db.collection('teams').findOne({ name: teamName, ownerId });
    if (!team) {
      return res.status(404).json({ error: `Team '${teamName}' not found.` });
    }

    // Only count directory members (password: null) managed by this admin, not admin login accounts
    const memberCount = await db.collection('users').countDocuments({
      team: teamName,
      password: null,
      managedBy: ownerId,
    });

    if (memberCount > 0) {
      return res.status(400).json({
        error: `Cannot delete '${teamName}' — ${memberCount} member(s) are still assigned to it. Reassign or remove them first.`,
      });
    }

    // Unassign any tasks that belonged to this team within this admin's workspace
    await db.collection('tasks').updateMany(
      { team: teamName, ownerId },
      { $set: { team: 'Unassigned' } }
    );

    await db.collection('teams').deleteOne({ name: teamName, ownerId });
    await logActivity(`${req.user.name} deleted team '${teamName}'`, ownerId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
