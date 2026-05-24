/**
 * @file organization.controller.js
 */
import * as organizationService from '../services/organization.service.js';
import { membershipRepository } from '../repositories/membership.repository.js';
import { listOrgMembersWithUsers, inviteUserToOrganization } from '../services/membership.service.js';
import { listRbacAuditLogs, writeRbacAuditLog } from '../services/rbacAudit.service.js';
import { getEffectivePermissions } from '../services/rbac.service.js';
import { rbacConfig } from '../config/rbac.config.js';
import { organizationRepository } from '../repositories/organization.repository.js';

export async function listOrganizations(req, res, next) {
  try {
    const isSuperadmin =
      req.user.accountRole === 'superadmin' || req.user.accountRole === 'super_admin';
    const orgs = isSuperadmin
      ? await organizationRepository.listAll({ status: 'active' })
      : await organizationService.listUserOrganizations(req.user.id);
    res.json({ organizations: orgs });
  } catch (err) {
    next(err);
  }
}

export async function createOrganization(req, res, next) {
  try {
    const isSuperadmin = req.user.accountRole === 'superadmin';
    if (!isSuperadmin && !rbacConfig.allowSelfServeOrgCreate) {
      return res.status(403).json({ error: 'Only platform administrators can create organizations.' });
    }
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Organization name is required.' });
    }
    const result = await organizationService.createOrganization({
      name: name.trim(),
      createdBy: req.user.id,
    });
    await writeRbacAuditLog({
      organizationId: result.organization.id,
      actorId: req.user.id,
      action: 'ORGANIZATION_CREATED',
      resourceType: 'organization',
      resourceId: result.organization.id,
      req,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOrganization(req, res, next) {
  try {
    res.json({ organization: req.context.organization });
  } catch (err) {
    next(err);
  }
}

export async function updateOrganization(req, res, next) {
  try {
    const { name, settings, status } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (settings) updates.settings = settings;
    if (status && req.context.isPlatformAdmin) updates.status = status;

    const org = await organizationService.updateOrganization(req.params.orgId, updates);
    await writeRbacAuditLog({
      organizationId: org.id,
      actorId: req.user.id,
      action: 'ORGANIZATION_UPDATED',
      resourceType: 'organization',
      resourceId: org.id,
      metadata: updates,
      req,
    });
    res.json({ organization: org });
  } catch (err) {
    next(err);
  }
}

export async function deleteOrganization(req, res, next) {
  try {
    await organizationRepository.deleteById(req.params.orgId);
    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      actorId: req.user.id,
      action: 'ORGANIZATION_DELETED',
      resourceType: 'organization',
      resourceId: req.params.orgId,
      req,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function listMembers(req, res, next) {
  try {
    const members = await listOrgMembersWithUsers(req.params.orgId);
    res.json({ members });
  } catch (err) {
    next(err);
  }
}

export async function inviteMember(req, res, next) {
  try {
    const { email, name, roleKey } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await inviteUserToOrganization({
      organizationId: req.params.orgId,
      email,
      name,
      roleKey: roleKey || 'developer',
      invitedBy: req.user.id,
      projectId: req.body.projectId || null,
    });

    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      actorId: req.user.id,
      action: 'USER_INVITED',
      resourceType: 'user',
      resourceId: user.id,
      metadata: { email, roleKey },
      req,
    });

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ error: 'roleId is required.' });

    const updated = await membershipRepository.updateOrgMembership(
      req.params.orgId,
      req.params.userId,
      { roleId, status: 'active' }
    );

    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      actorId: req.user.id,
      action: 'MEMBER_ROLE_UPDATED',
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

export async function removeMember(req, res, next) {
  try {
    await membershipRepository.deleteOrgMembership(req.params.orgId, req.params.userId);
    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      actorId: req.user.id,
      action: 'MEMBER_REMOVED',
      resourceType: 'user',
      resourceId: req.params.userId,
      req,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getMyPermissions(req, res, next) {
  try {
    const isSuperAdmin = req.user?.accountRole === 'superadmin' || req.user?.accountRole === 'super_admin';
    if (isSuperAdmin) {
      // Super admin gets all permissions explicitly listed
      const { ALL_PERMISSIONS } = await import('../constants/permissions.js');
      return res.json({ permissions: ALL_PERMISSIONS });
    }

    const perms = await getEffectivePermissions(req.user, req.context);
    const permArray = [...perms].filter(p => p !== '*');

    // If wildcard (org admin with full access), expand to all permissions
    if (perms.has('*')) {
      const { ALL_PERMISSIONS } = await import('../constants/permissions.js');
      return res.json({ permissions: ALL_PERMISSIONS });
    }

    res.json({ permissions: permArray });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const logs = await listRbacAuditLogs(req.params.orgId, {
      limit: Number(req.query.limit) || 50,
      skip: Number(req.query.skip) || 0,
    });
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}
