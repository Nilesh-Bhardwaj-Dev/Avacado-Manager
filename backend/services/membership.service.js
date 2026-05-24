import { getDB } from '../config/db.js';
import { membershipRepository } from '../repositories/membership.repository.js';
import { roleRepository } from '../repositories/role.repository.js';
import { getSystemRoleByKey } from '../seed/rbac.seed.js';
import { RoleKey } from '../constants/roleKeys.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @param {string} organizationId
 * @param {string} userId
 * @param {string} roleId
 */
export async function assignOrgRole(organizationId, userId, roleId, invitedBy = null) {
  const existing = await membershipRepository.findOrgMembership(organizationId, userId);
  if (existing) {
    return membershipRepository.updateOrgMembership(organizationId, userId, {
      roleId,
      status: 'active',
      joinedAt: existing.joinedAt || new Date(),
    });
  }
  return membershipRepository.createOrgMembership({
    organizationId,
    userId,
    roleId,
    status: 'active',
    invitedBy,
    joinedAt: new Date(),
  });
}

/**
 * @param {string} projectId
 * @param {string} organizationId
 * @param {string} userId
 * @param {string} roleId
 */
export async function assignProjectRole(projectId, organizationId, userId, roleId, invitedBy = null) {
  const existing = await membershipRepository.findProjectMembership(projectId, userId);
  if (existing) {
    return membershipRepository.updateProjectMembership(projectId, userId, {
      roleId,
      status: 'active',
      joinedAt: existing.joinedAt || new Date(),
    });
  }
  return membershipRepository.createProjectMembership({
    organizationId,
    projectId,
    userId,
    roleId,
    status: 'active',
    invitedBy,
    joinedAt: new Date(),
  });
}

/**
 * Invite user by email — creates user if needed, org + default project membership.
 */
export async function inviteUserToOrganization({
  organizationId,
  email,
  name,
  roleKey = RoleKey.DEVELOPER,
  invitedBy,
  projectId = null,
}) {
  const db = getDB();
  const role = await getSystemRoleByKey(roleKey);
  if (!role) {
    const err = new Error('Invalid role.');
    err.status = 400;
    throw err;
  }

  const isSaaSAdmin = [RoleKey.ORG_ADMIN, RoleKey.PROJECT_MANAGER].includes(roleKey);
  let user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user) {
    const id = `user-${uuidv4().slice(0, 8)}`;
    user = {
      id,
      email: email.toLowerCase(),
      username: email.split('@')[0],
      password: null,
      name: name || email.split('@')[0],
      role: role.name,
      team: null,
      accountRole: isSaaSAdmin ? 'admin' : 'user',
      status: 'active',
      managedBy: null,
      emailVerified: false,
      defaultOrganizationId: organizationId,
      avatar: (name || email).slice(0, 2).toUpperCase(),
      bio: '',
    };
    await db.collection('users').insertOne(user);
  } else if (isSaaSAdmin && user.accountRole === 'user') {
    await db.collection('users').updateOne(
      { id: user.id },
      { $set: { accountRole: 'admin' } }
    );
    user.accountRole = 'admin';
  }

  await assignOrgRole(organizationId, user.id, role.id, invitedBy);

  const { projectRepository } = await import('../repositories/project.repository.js');
  const targetProject =
    (projectId && (await projectRepository.findByOrgAndId(organizationId, projectId))) ||
    (await projectRepository.findDefaultByOrg(organizationId));

  if (targetProject) {
    const projRole = await getSystemRoleByKey(roleKey);
    await assignProjectRole(targetProject.id, organizationId, user.id, projRole.id, invitedBy);
  }

  return user;
}

export async function listOrgMembersWithUsers(organizationId) {
  const db = getDB();
  const memberships = await membershipRepository.listOrgMemberships(organizationId);
  const userIds = memberships.map((m) => m.userId);
  const users = await db
    .collection('users')
    .find({ id: { $in: userIds } })
    .project({ password: 0, passwordHistory: 0, twoFactor: 0 })
    .toArray();
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const roles = await roleRepository.findByOrg(organizationId);
  const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));

  return memberships.map((m) => ({
    ...m,
    user: userMap[m.userId] || null,
    role: roleMap[m.roleId] || null,
  }));
}

export async function listProjectMembersWithUsers(projectId) {
  const db = getDB();
  const memberships = await membershipRepository.listProjectMemberships(projectId);
  const userIds = memberships.map((m) => m.userId);
  const users = await db
    .collection('users')
    .find({ id: { $in: userIds } })
    .project({ password: 0, passwordHistory: 0, twoFactor: 0 })
    .toArray();
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const roles = await roleRepository.findByOrg(null);
  const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));

  return memberships.map((m) => ({
    ...m,
    user: userMap[m.userId] || null,
    role: roleMap[m.roleId] || null,
  }));
}
