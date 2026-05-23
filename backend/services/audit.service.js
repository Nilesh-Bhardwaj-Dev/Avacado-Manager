/**
 * @file audit.service.js
 * @description Security audit log persistence (separate from workspace activity feed).
 */
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/db.js';
import { Collections } from '../constants/collections.js';
import { getRequestDeviceInfo } from '../utils/device.util.js';
import { logger } from '../utils/logger.js';

export const AuditEvent = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL: 'LOGOUT_ALL',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  ROLE_CHANGE: 'ROLE_CHANGE',
  USER_CREATED: 'USER_CREATED',
  USER_DELETED: 'USER_DELETED',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
};

/**
 * @param {object} params
 * @param {string} params.event
 * @param {string} [params.userId]
 * @param {string} [params.actorId]
 * @param {string} [params.actorName]
 * @param {string} [params.tenantId]
 * @param {object} [params.metadata]
 * @param {import('express').Request} [params.req]
 */
export async function writeAuditLog({
  event,
  userId = null,
  actorId = null,
  actorName = null,
  tenantId = null,
  metadata = {},
  req = null,
}) {
  try {
    const db = getDB();
    const device = req ? getRequestDeviceInfo(req) : null;

    await db.collection(Collections.SECURITY_AUDIT_LOGS).insertOne({
      id: `audit-${uuidv4()}`,
      event,
      userId,
      actorId,
      actorName,
      tenantId,
      metadata,
      device,
      createdAt: new Date(),
    });
  } catch (err) {
    logger.error('Failed to write audit log', { event, error: err.message });
  }
}

/**
 * @param {object} query
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
export async function listAuditLogs(query = {}, limit = 100) {
  const db = getDB();
  return db
    .collection(Collections.SECURITY_AUDIT_LOGS)
    .find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 500))
    .toArray();
}
