import { v4 as uuidv4 } from 'uuid';
import { organizationRepository } from '../repositories/organization.repository.js';
import { projectRepository } from '../repositories/project.repository.js';
import { membershipRepository } from '../repositories/membership.repository.js';
import { getSystemRoleByKey } from '../seed/rbac.seed.js';
import { RoleKey } from '../constants/roleKeys.js';

function slugify(name) {
  return `${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || `org-${uuidv4().slice(0, 8)}`;
}

/**
 * @param {object} params
 */
export async function createOrganization({ name, createdBy, legacyOwnerId = null }) {
  let slug = slugify(name);
  let attempt = 0;
  while (await organizationRepository.findBySlug(slug)) {
    attempt += 1;
    slug = `${slugify(name)}-${attempt}`;
  }

  const org = await organizationRepository.create({
    name,
    slug,
    createdBy,
    legacyOwnerId,
    status: 'active',
  });

  const project = await projectRepository.create({
    organizationId: org.id,
    name: 'General',
    key: 'GEN',
    description: 'Default project',
    createdBy,
    isDefault: true,
    status: 'active',
  });

  const orgAdminRole = await getSystemRoleByKey(RoleKey.ORG_ADMIN);
  const devRole = await getSystemRoleByKey(RoleKey.DEVELOPER);

  if (createdBy && orgAdminRole) {
    await membershipRepository.createOrgMembership({
      organizationId: org.id,
      userId: createdBy,
      roleId: orgAdminRole.id,
      status: 'active',
      joinedAt: new Date(),
    });
    await membershipRepository.createProjectMembership({
      organizationId: org.id,
      projectId: project.id,
      userId: createdBy,
      roleId: devRole?.id || orgAdminRole.id,
      status: 'active',
      joinedAt: new Date(),
    });
  }

  return { organization: org, defaultProject: project };
}

export async function getOrganization(orgId) {
  return organizationRepository.findById(orgId);
}

export async function updateOrganization(orgId, updates) {
  return organizationRepository.updateById(orgId, updates);
}

export async function listUserOrganizations(userId) {
  const memberships = await membershipRepository.listUserOrgMemberships(userId);
  const orgIds = memberships.map((m) => m.organizationId);
  return organizationRepository.listForUser(orgIds);
}
