/**
 * @file roleKeys.js
 * @description System role keys for RBAC seed and assignment.
 */

export const RoleKey = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  PROJECT_MANAGER: 'project_manager',
  TEAM_LEAD: 'team_lead',
  DEVELOPER: 'developer',
  QA_ENGINEER: 'qa_engineer',
  VIEWER: 'viewer',
};

export const RoleScope = {
  PLATFORM: 'platform',
  ORGANIZATION: 'organization',
  PROJECT: 'project',
};

/** Maps legacy accountRole to system role key */
export const LEGACY_ACCOUNT_ROLE_MAP = {
  superadmin: RoleKey.SUPER_ADMIN,
  admin: RoleKey.ORG_ADMIN,
  projectmanager: RoleKey.PROJECT_MANAGER,
  teamlead: RoleKey.TEAM_LEAD,
  user: RoleKey.DEVELOPER,
  viewer: RoleKey.VIEWER,
};
