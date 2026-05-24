/**
 * @file project.controller.js
 */
import * as projectService from '../services/project.service.js';
import {
  listProjectMembersWithUsers,
  assignProjectRole,
} from '../services/membership.service.js';
import { membershipRepository } from '../repositories/membership.repository.js';
import { writeRbacAuditLog } from '../services/rbacAudit.service.js';

export async function listProjects(req, res, next) {
  try {
    const projects = await projectService.listProjects(req.params.orgId);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const { name, key, description } = req.body;
    if (!name || !key) {
      return res.status(400).json({ error: 'name and key are required.' });
    }
    const project = await projectService.createProject({
      organizationId: req.params.orgId,
      name,
      key,
      description,
      createdBy: req.user.id,
    });
    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      projectId: project.id,
      actorId: req.user.id,
      action: 'PROJECT_CREATED',
      resourceType: 'project',
      resourceId: project.id,
      req,
    });
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    res.json({ project: req.context.project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.body);
    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      projectId: project.id,
      actorId: req.user.id,
      action: 'PROJECT_UPDATED',
      resourceType: 'project',
      resourceId: project.id,
      req,
    });
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.projectId);
    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      projectId: req.params.projectId,
      actorId: req.user.id,
      action: 'PROJECT_DELETED',
      resourceType: 'project',
      resourceId: req.params.projectId,
      req,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function listProjectMembers(req, res, next) {
  try {
    const members = await listProjectMembersWithUsers(req.params.projectId);
    res.json({ members });
  } catch (err) {
    next(err);
  }
}

export async function updateProjectMemberRole(req, res, next) {
  try {
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ error: 'roleId is required.' });

    const updated = await assignProjectRole(
      req.params.projectId,
      req.params.orgId,
      req.params.userId,
      roleId,
      req.user.id
    );

    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      projectId: req.params.projectId,
      actorId: req.user.id,
      action: 'PROJECT_MEMBER_ROLE_UPDATED',
      resourceType: 'user',
      resourceId: req.params.userId,
      metadata: { roleId },
      req,
    });

    res.json({ membership: updated });
  } catch (err) {
    next(err);
  }
}

export async function removeProjectMember(req, res, next) {
  try {
    await membershipRepository.deleteProjectMembership(req.params.projectId, req.params.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
