/**
 * @file orgTeam.controller.js
 */
import { OrgTeamModel } from '../models/OrgTeam.model.js';
import { writeRbacAuditLog } from '../services/rbacAudit.service.js';

export async function listTeams(req, res, next) {
  try {
    const filter = { organizationId: req.params.orgId };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    const teams = await OrgTeamModel.find(filter).lean();
    res.json({ teams });
  } catch (err) {
    next(err);
  }
}

export async function createTeam(req, res, next) {
  try {
    const { name, projectId, memberIds, leadUserId } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });

    const team = await OrgTeamModel.create({
      organizationId: req.params.orgId,
      projectId: projectId || req.context?.projectId || null,
      name,
      memberIds: memberIds || [],
      leadUserId: leadUserId || null,
    });

    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      projectId: team.projectId,
      actorId: req.user.id,
      action: 'TEAM_CREATED',
      resourceType: 'team',
      resourceId: team.id,
      req,
    });

    res.status(201).json({ team });
  } catch (err) {
    next(err);
  }
}

export async function updateTeam(req, res, next) {
  try {
    const team = await OrgTeamModel.findOneAndUpdate(
      { id: req.params.teamId, organizationId: req.params.orgId },
      { $set: req.body },
      { new: true }
    ).lean();
    if (!team) return res.status(404).json({ error: 'Team not found.' });
    res.json({ team });
  } catch (err) {
    next(err);
  }
}

export async function deleteTeam(req, res, next) {
  try {
    await OrgTeamModel.findOneAndDelete({
      id: req.params.teamId,
      organizationId: req.params.orgId,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
