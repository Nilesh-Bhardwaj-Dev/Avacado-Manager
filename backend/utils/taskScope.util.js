/**
 * @file taskScope.util.js
 * @description Resolves task query scope for legacy vs RBAC modes.
 */
import { rbacConfig } from '../config/rbac.config.js';
import { organizationRepository } from '../repositories/organization.repository.js';

/**
 * @param {import('express').Request} req
 * @returns {Promise<{ query: object, ownerId: string|null, organizationId?: string, projectId?: string }>}
 */
export async function resolveTaskScope(req) {
  if (req.context?.organizationId && req.context?.projectId) {
    const org = req.context.organization || (await organizationRepository.findById(req.context.organizationId));
    const ownerId = org?.legacyOwnerId || null;
    return {
      query: {
        organizationId: req.context.organizationId,
        projectId: req.context.projectId,
      },
      ownerId,
      organizationId: req.context.organizationId,
      projectId: req.context.projectId,
    };
  }

  const ownerId =
    req.user.accountRole === 'admin'
      ? req.user.id
      : req.user.accountRole === 'user'
        ? req.user.managedBy
        : null;

  const query = ownerId ? { ownerId } : {};
  return { query, ownerId, organizationId: null, projectId: null };
}

/**
 * @param {object} taskDoc
 * @param {object} scope
 */
export function applyTaskScopeFields(taskDoc, scope) {
  if (scope.organizationId) {
    taskDoc.organizationId = scope.organizationId;
    taskDoc.projectId = scope.projectId;
  }
  if (scope.ownerId || rbacConfig.legacyMode) {
    taskDoc.ownerId = scope.ownerId || taskDoc.ownerId;
  }
  return taskDoc;
}

/**
 * @param {object} baseQuery
 * @param {string} taskId
 */
export function taskIdQuery(baseQuery, taskId) {
  return { ...baseQuery, id: taskId };
}
