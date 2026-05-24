/**
 * @file rbacAudit.service.js
 * @description Business / authorization audit logging.
 */
import { RbacAuditLogModel } from '../models/RbacAuditLog.model.js';
import { getRequestDeviceInfo } from '../utils/device.util.js';

/**
 * @param {object} params
 */
export async function writeRbacAuditLog({
  organizationId = null,
  projectId = null,
  actorId,
  action,
  resourceType = null,
  resourceId = null,
  metadata = {},
  req = null,
}) {
  const device = req ? getRequestDeviceInfo(req) : null;
  await RbacAuditLogModel.create({
    organizationId,
    projectId,
    actorId,
    action,
    resourceType,
    resourceId,
    metadata,
    ip: device?.ip || null,
    userAgent: device?.userAgent || null,
  });
}

/**
 * @param {string} organizationId
 * @param {object} options
 */
export async function listRbacAuditLogs(organizationId, { limit = 50, skip = 0 } = {}) {
  const logs = await RbacAuditLogModel.find({ organizationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const actorIds = [...new Set(logs.map(l => l.actorId).filter(Boolean))];
  if (actorIds.length > 0) {
    const db = RbacAuditLogModel.db;
    const users = await db.collection('users')
      .find({ id: { $in: actorIds } })
      .project({ id: 1, name: 1, email: 1 })
      .toArray();
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    for (const log of logs) {
      if (log.actorId && userMap[log.actorId]) {
        log.actorName = userMap[log.actorId].name;
        log.actorEmail = userMap[log.actorId].email;
      }
    }
  }
  return logs;
}
