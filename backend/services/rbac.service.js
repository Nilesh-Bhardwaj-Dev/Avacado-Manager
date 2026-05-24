/**
 * @file rbac.service.js
 * @description Permission resolution with role inheritance.
 */
import { roleRepository } from '../repositories/role.repository.js';
import { membershipRepository } from '../repositories/membership.repository.js';
import { AccountRole } from '../constants/roles.js';
import { rbacConfig } from '../config/rbac.config.js';

const roleCache = new Map();
const CACHE_TTL_MS = 60_000;

/**
 * @param {string} roleId
 * @returns {Promise<Set<string>>}
 */
export async function resolveRolePermissions(roleId) {
  const cacheKey = `role:${roleId}`;
  const cached = roleCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.perms;
  }

  const visited = new Set();
  const permissions = new Set();
  let currentId = roleId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const role = await roleRepository.findById(currentId);
    if (!role) break;

    for (const key of role.permissionKeys || []) {
      permissions.add(key);
    }
    currentId = role.inheritsFromRoleId || null;
  }

  roleCache.set(cacheKey, { perms: permissions, at: Date.now() });
  return permissions;
}

/**
 * @param {object} user
 * @param {object} context
 * @returns {Promise<Set<string>>}
 */
export async function getEffectivePermissions(user, context = {}) {
  if (!user) return new Set();

  const isPlatformAdmin =
    user.isPlatformAdmin ||
    user.accountRole === AccountRole.SUPER_ADMIN ||
    user.accountRole === 'superadmin';

  if (isPlatformAdmin) {
    const superRole = await roleRepository.findSystemByKey('super_admin');
    if (superRole) {
      return resolveRolePermissions(superRole.id);
    }
    return new Set(['*']);
  }

  const effective = new Set();
  const { organizationId, projectId, orgMembership, projectMembership } = context;

  if (orgMembership?.roleId) {
    const orgPerms = await resolveRolePermissions(orgMembership.roleId);
    orgPerms.forEach((p) => effective.add(p));
  } else if (organizationId) {
    const mem = await membershipRepository.findOrgMembership(organizationId, user.id);
    if (mem?.roleId) {
      const orgPerms = await resolveRolePermissions(mem.roleId);
      orgPerms.forEach((p) => effective.add(p));
    }
  }

  if (projectId) {
    const projMem =
      projectMembership ||
      (await membershipRepository.findProjectMembership(projectId, user.id));
    if (projMem?.roleId) {
      const projPerms = await resolveRolePermissions(projMem.roleId);
      projPerms.forEach((p) => effective.add(p));
    }
  }

  return effective;
}

/**
 * @param {object} user
 * @param {string|string[]} permission
 * @param {object} context
 * @returns {Promise<boolean>}
 */
export async function hasPermission(user, permission, context = {}) {
  if (rbacConfig.legacyMode) return true;
  const required = Array.isArray(permission) ? permission : [permission];
  const effective = await getEffectivePermissions(user, context);

  if (effective.has('*')) return true;
  return required.every((p) => effective.has(p));
}

/**
 * @param {object} user
 * @param {string[]} permissions
 * @param {object} context
 * @returns {Promise<boolean>}
 */
export async function hasAnyPermission(user, permissions, context = {}) {
  if (rbacConfig.legacyMode) return true;
  const effective = await getEffectivePermissions(user, context);
  if (effective.has('*')) return true;
  return permissions.some((p) => effective.has(p));
}

export function clearRoleCache() {
  roleCache.clear();
}
