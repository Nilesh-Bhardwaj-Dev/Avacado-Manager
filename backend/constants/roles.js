/**
 * @file roles.js
 * @description Role constants and authorization helpers for multi-tenant RBAC.
 */

/** Platform & workspace account roles (stored on user.accountRole) */
export const AccountRole = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  TEAM_LEAD: 'teamlead',
  PROJECT_MANAGER: 'projectmanager',
  USER: 'user',
  VIEWER: 'viewer',
};

/** Display / job titles often stored in user.role */
export const WorkspaceRoleLabel = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  TEAM_LEAD: 'TeamLead',
  PROJECT_MANAGER: 'ProjectManager',
  USER: 'User',
  VIEWER: 'Viewer',
};

/** Numeric hierarchy — higher value = more privilege */
export const ROLE_HIERARCHY = {
  [AccountRole.VIEWER]: 10,
  [AccountRole.USER]: 20,
  [AccountRole.TEAM_LEAD]: 30,
  [AccountRole.PROJECT_MANAGER]: 40,
  [AccountRole.ADMIN]: 50,
  [AccountRole.SUPER_ADMIN]: 100,
};

/** Roles allowed to manage tenant workspaces */
export const TENANT_ADMIN_ROLES = [
  AccountRole.SUPER_ADMIN,
  AccountRole.ADMIN,
  AccountRole.PROJECT_MANAGER,
  AccountRole.TEAM_LEAD,
];

/**
 * Normalizes legacy accountRole values.
 * @param {string} accountRole
 * @returns {string}
 */
export function normalizeAccountRole(accountRole) {
  const map = {
    superadmin: AccountRole.SUPER_ADMIN,
    admin: AccountRole.ADMIN,
    user: AccountRole.USER,
    teamlead: AccountRole.TEAM_LEAD,
    projectmanager: AccountRole.PROJECT_MANAGER,
    viewer: AccountRole.VIEWER,
  };
  return map[String(accountRole || '').toLowerCase()] || accountRole;
}

/**
 * @param {string} userRole
 * @param {string[]} allowedRoles
 * @returns {boolean}
 */
export function hasAccountRole(userRole, allowedRoles) {
  const normalized = normalizeAccountRole(userRole);
  return allowedRoles.map(normalizeAccountRole).includes(normalized);
}

/**
 * @param {string} userRole
 * @param {string} minimumRole
 * @returns {boolean}
 */
export function hasMinimumRole(userRole, minimumRole) {
  const userLevel = ROLE_HIERARCHY[normalizeAccountRole(userRole)] ?? 0;
  const minLevel = ROLE_HIERARCHY[normalizeAccountRole(minimumRole)] ?? 0;
  return userLevel >= minLevel;
}
