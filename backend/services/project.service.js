import { projectRepository } from '../repositories/project.repository.js';
import { membershipRepository } from '../repositories/membership.repository.js';
import { getSystemRoleByKey } from '../seed/rbac.seed.js';
import { RoleKey } from '../constants/roleKeys.js';

export async function createProject({ organizationId, name, key, description, createdBy }) {
  const project = await projectRepository.create({
    organizationId,
    name,
    key: key.toUpperCase(),
    description: description || '',
    createdBy,
    status: 'active',
  });

  if (createdBy) {
    const pmRole = await getSystemRoleByKey(RoleKey.PROJECT_MANAGER);
    if (pmRole) {
      await membershipRepository.createProjectMembership({
        organizationId,
        projectId: project.id,
        userId: createdBy,
        roleId: pmRole.id,
        status: 'active',
        joinedAt: new Date(),
      });
    }
  }

  return project;
}

export async function listProjects(organizationId) {
  return projectRepository.listByOrg(organizationId);
}

export async function getProject(organizationId, projectId) {
  return projectRepository.findByOrgAndId(organizationId, projectId);
}

export async function updateProject(projectId, updates) {
  return projectRepository.updateById(projectId, updates);
}

export async function deleteProject(projectId) {
  return projectRepository.deleteById(projectId);
}
