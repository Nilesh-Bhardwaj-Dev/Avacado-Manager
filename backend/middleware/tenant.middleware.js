/**
 * @file tenant.middleware.js
 * @description Resolves organization/project context from headers or route params.
 */
import { organizationRepository } from '../repositories/organization.repository.js';
import { projectRepository } from '../repositories/project.repository.js';
import { membershipRepository } from '../repositories/membership.repository.js';
import { AccountRole } from '../constants/roles.js';

function getOrgId(req) {
  return (
    req.params.orgId ||
    req.headers['x-organization-id'] ||
    req.headers['X-Organization-Id']
  );
}

function getProjectId(req) {
  return (
    req.params.projectId ||
    req.headers['x-project-id'] ||
    req.headers['X-Project-Id']
  );
}

function isPlatformAdmin(user) {
  return (
    user?.accountRole === AccountRole.SUPER_ADMIN ||
    user?.accountRole === 'superadmin'
  );
}

/**
 * Requires organization context. Sets req.context.
 */
export function resolveTenantContext(options = {}) {
  const { requireProject = false } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const organizationId = getOrgId(req);
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization context required (X-Organization-Id).' });
      }

      const org = await organizationRepository.findById(organizationId);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found.' });
      }

      if (org.status === 'suspended' && !isPlatformAdmin(req.user)) {
        return res.status(403).json({ error: 'Organization is suspended.' });
      }

      let orgMembership = null;
      let projectMembership = null;
      const projectId = getProjectId(req);

      if (!isPlatformAdmin(req.user)) {
        orgMembership = await membershipRepository.findOrgMembership(organizationId, req.user.id);
        if (!orgMembership) {
          return res.status(403).json({ error: 'Not a member of this organization.' });
        }
      }

      if (projectId) {
        const project = await projectRepository.findByOrgAndId(organizationId, projectId);
        if (!project) {
          return res.status(404).json({ error: 'Project not found.' });
        }

        if (!isPlatformAdmin(req.user)) {
          projectMembership = await membershipRepository.findProjectMembership(projectId, req.user.id);
          if (!projectMembership) {
            return res.status(403).json({ error: 'Not a member of this project.' });
          }
        }

        req.context = {
          organizationId,
          projectId,
          organization: org,
          project,
          orgMembership,
          projectMembership,
          isPlatformAdmin: isPlatformAdmin(req.user),
        };
      } else {
        if (requireProject) {
          return res.status(400).json({ error: 'Project context required (X-Project-Id).' });
        }
        req.context = {
          organizationId,
          projectId: null,
          organization: org,
          project: null,
          orgMembership,
          projectMembership: null,
          isPlatformAdmin: isPlatformAdmin(req.user),
        };
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Optional org context — does not fail if missing.
 */
export function optionalTenantContext(req, res, next) {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    req.context = { organizationId: null, projectId: null, isPlatformAdmin: isPlatformAdmin(req.user) };
    return next();
  }
  return resolveTenantContext()(req, res, next);
}
