/**
 * @file rbac.seed.js
 * @description Seeds permissions and system roles with inheritance.
 */
import { v4 as uuidv4 } from 'uuid';
import { Permission, PERMISSION_CATALOG } from '../constants/permissions.js';
import { RoleKey, RoleScope } from '../constants/roleKeys.js';
import { PermissionModel, RoleModel } from '../models/index.js';
import { logger } from '../utils/logger.js';

const VIEWER_PERMS = [Permission.VIEW_REPORTS];



const PROJECT_MANAGER_PERMS = [
  Permission.CREATE_PROJECT,
  Permission.EDIT_PROJECT,
  Permission.DELETE_PROJECT,
  Permission.CREATE_TASK,
  Permission.EDIT_TASK,
  Permission.DELETE_TASK,
  Permission.ASSIGN_TASK,
  Permission.EXPORT_REPORTS,
  Permission.VIEW_REPORTS,
  Permission.INVITE_USER,
  Permission.MANAGE_ROLES,
];

const ORG_ADMIN_PERMS = [
  ...PROJECT_MANAGER_PERMS,
  Permission.INVITE_USER,
  Permission.MANAGE_ROLES,
  Permission.MANAGE_ORGANIZATION,
  Permission.MANAGE_BILLING,
  Permission.VIEW_AUDIT_LOGS,
];

const SYSTEM_ROLES = [
  {
    key: RoleKey.SUPER_ADMIN,
    name: 'Super Admin',
    scope: RoleScope.PLATFORM,
    isSystem: true,
    inheritsFromRoleId: null,
    permissionKeys: Object.values(Permission),
  },
  {
    key: RoleKey.ORG_ADMIN,
    name: 'Organization Admin',
    scope: RoleScope.ORGANIZATION,
    isSystem: true,
    inheritsFromRoleId: null,
    permissionKeys: ORG_ADMIN_PERMS,
  },
  {
    key: RoleKey.PROJECT_MANAGER,
    name: 'Project Manager',
    scope: RoleScope.PROJECT,
    isSystem: true,
    inheritsFromRoleId: null,
    permissionKeys: PROJECT_MANAGER_PERMS,
  },
  {
    key: RoleKey.VIEWER,
    name: 'Viewer',
    scope: RoleScope.PROJECT,
    isSystem: true,
    inheritsFromRoleId: null,
    permissionKeys: VIEWER_PERMS,
  },
  {
    key: RoleKey.DEVELOPER,
    name: 'Developer',
    scope: RoleScope.PROJECT,
    isSystem: true,
    inheritsFromRoleId: null, // resolved after seed by key lookup
    inheritKey: RoleKey.VIEWER,
    permissionKeys: [Permission.CREATE_TASK, Permission.EDIT_TASK],
  },
  {
    key: RoleKey.TEAM_LEAD,
    name: 'Team Lead',
    scope: RoleScope.PROJECT,
    isSystem: true,
    inheritsFromRoleId: null,
    inheritKey: RoleKey.DEVELOPER,
    permissionKeys: [Permission.ASSIGN_TASK, Permission.DELETE_TASK],
  },
  {
    key: RoleKey.QA_ENGINEER,
    name: 'QA Engineer',
    scope: RoleScope.PROJECT,
    isSystem: true,
    inheritsFromRoleId: null,
    inheritKey: RoleKey.VIEWER,
    permissionKeys: [Permission.CREATE_TASK, Permission.EDIT_TASK],
  },
];

export async function seedRbac() {
  for (const perm of PERMISSION_CATALOG) {
    await PermissionModel.findOneAndUpdate(
      { key: perm.key },
      {
        $set: { ...perm, description: perm.description || '' },
        $setOnInsert: { id: uuidv4() },
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  const roleIdByKey = {};

  for (const role of SYSTEM_ROLES) {
    const roleData = { ...role };
    delete roleData.inheritKey;
    const doc = await RoleModel.findOneAndUpdate(
      { key: role.key, organizationId: null },
      {
        $set: { ...roleData, organizationId: null },
        $setOnInsert: { id: uuidv4() },
      },
      { upsert: true, returnDocument: 'after' }
    );
    roleIdByKey[role.key] = doc.id;
  }

  for (const role of SYSTEM_ROLES) {
    if (!role.inheritKey) continue;
    const parentId = roleIdByKey[role.inheritKey];
    if (parentId) {
      await RoleModel.updateOne(
        { key: role.key, organizationId: null },
        { $set: { inheritsFromRoleId: parentId } }
      );
    }
  }

  logger.info('[RBAC Seed] Permissions and system roles ensured');
  return roleIdByKey;
}

/**
 * @param {string} roleKey
 * @returns {Promise<object|null>}
 */
export async function getSystemRoleByKey(roleKey) {
  return RoleModel.findOne({ key: roleKey, organizationId: null, isSystem: true }).lean();
}
