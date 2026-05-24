/**
 * @file permissions.js
 * @description Canonical permission keys for RBAC.
 */

export const PermissionScope = {
  PLATFORM: 'platform',
  ORGANIZATION: 'organization',
  PROJECT: 'project',
};

export const Permission = {
  CREATE_PROJECT: 'create_project',
  EDIT_PROJECT: 'edit_project',
  DELETE_PROJECT: 'delete_project',
  CREATE_TASK: 'create_task',
  EDIT_TASK: 'edit_task',
  DELETE_TASK: 'delete_task',
  ASSIGN_TASK: 'assign_task',
  INVITE_USER: 'invite_user',
  MANAGE_ROLES: 'manage_roles',
  EXPORT_REPORTS: 'export_reports',
  VIEW_REPORTS: 'view_reports',
  MANAGE_ORGANIZATION: 'manage_organization',
  MANAGE_BILLING: 'manage_billing',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
};

export const ALL_PERMISSIONS = Object.values(Permission);

/** Permission catalog metadata for seeding */
export const PERMISSION_CATALOG = [
  { key: Permission.CREATE_PROJECT, name: 'Create Project', scope: PermissionScope.ORGANIZATION },
  { key: Permission.EDIT_PROJECT, name: 'Edit Project', scope: PermissionScope.PROJECT },
  { key: Permission.DELETE_PROJECT, name: 'Delete Project', scope: PermissionScope.PROJECT },
  { key: Permission.CREATE_TASK, name: 'Create Task', scope: PermissionScope.PROJECT },
  { key: Permission.EDIT_TASK, name: 'Edit Task', scope: PermissionScope.PROJECT },
  { key: Permission.DELETE_TASK, name: 'Delete Task', scope: PermissionScope.PROJECT },
  { key: Permission.ASSIGN_TASK, name: 'Assign Task', scope: PermissionScope.PROJECT },
  { key: Permission.INVITE_USER, name: 'Invite User', scope: PermissionScope.ORGANIZATION },
  { key: Permission.MANAGE_ROLES, name: 'Manage Roles', scope: PermissionScope.ORGANIZATION },
  { key: Permission.EXPORT_REPORTS, name: 'Export Reports', scope: PermissionScope.PROJECT },
  { key: Permission.VIEW_REPORTS, name: 'View Reports', scope: PermissionScope.PROJECT },
  { key: Permission.MANAGE_ORGANIZATION, name: 'Manage Organization', scope: PermissionScope.ORGANIZATION },
  { key: Permission.MANAGE_BILLING, name: 'Manage Billing', scope: PermissionScope.ORGANIZATION },
  { key: Permission.VIEW_AUDIT_LOGS, name: 'View Audit Logs', scope: PermissionScope.ORGANIZATION },
];
