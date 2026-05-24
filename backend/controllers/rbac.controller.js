/**
 * @file rbac.controller.js
 */
import { roleRepository } from '../repositories/role.repository.js';
import { RoleModel } from '../models/Role.model.js';
import { clearRoleCache } from '../services/rbac.service.js';
import { writeRbacAuditLog } from '../services/rbacAudit.service.js';
import { Permission } from '../constants/permissions.js';

const RESTRICTED_ORG_PERMISSIONS = [Permission.MANAGE_BILLING];

export async function listRoles(req, res, next) {
  try {
    const roles = await roleRepository.findByOrg(req.params.orgId);
    res.json({ roles });
  } catch (err) {
    next(err);
  }
}

export async function createCustomRole(req, res, next) {
  try {
    const { name, key, permissionKeys, inheritsFromRoleId } = req.body;
    if (!name || !key) {
      return res.status(400).json({ error: 'name and key are required.' });
    }

    const invalid = (permissionKeys || []).filter((p) =>
      RESTRICTED_ORG_PERMISSIONS.includes(p)
    );
    if (invalid.length) {
      return res.status(400).json({
        error: `Cannot grant restricted permissions: ${invalid.join(', ')}`,
      });
    }

    const role = await roleRepository.create({
      name,
      key: key.toLowerCase().replace(/\s+/g, '_'),
      scope: 'organization',
      organizationId: req.params.orgId,
      isSystem: false,
      inheritsFromRoleId: inheritsFromRoleId || null,
      permissionKeys: permissionKeys || [],
    });

    clearRoleCache();
    await writeRbacAuditLog({
      organizationId: req.params.orgId,
      actorId: req.user.id,
      action: 'CUSTOM_ROLE_CREATED',
      resourceType: 'role',
      resourceId: role.id,
      req,
    });

    res.status(201).json({ role });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Role key already exists.' });
    }
    next(err);
  }
}

export async function updateRole(req, res, next) {
  try {
    const role = await roleRepository.findById(req.params.roleId);
    if (!role) return res.status(404).json({ error: 'Role not found.' });
    if (role.isSystem) {
      return res.status(403).json({ error: 'System roles cannot be modified.' });
    }
    if (role.organizationId !== req.params.orgId) {
      return res.status(403).json({ error: 'Role does not belong to this organization.' });
    }

    const { name, permissionKeys, inheritsFromRoleId } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (permissionKeys) updates.permissionKeys = permissionKeys;
    if (inheritsFromRoleId !== undefined) updates.inheritsFromRoleId = inheritsFromRoleId;

    const updated = await roleRepository.updateById(req.params.roleId, updates);
    clearRoleCache();
    res.json({ role: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteRole(req, res, next) {
  try {
    const role = await roleRepository.findById(req.params.roleId);
    if (!role) return res.status(404).json({ error: 'Role not found.' });
    if (role.isSystem) {
      return res.status(403).json({ error: 'System roles cannot be deleted.' });
    }

    await RoleModel.findOneAndDelete({ id: req.params.roleId });
    clearRoleCache();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
