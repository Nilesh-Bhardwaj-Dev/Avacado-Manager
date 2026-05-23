/**
 * @file loginSecurity.service.js
 * @description Login attempt tracking, account lockout, and login history.
 */
import { getDB } from '../config/db.js';
import { Collections } from '../constants/collections.js';
import { authConfig } from '../config/auth.config.js';
import { getRequestDeviceInfo } from '../utils/device.util.js';
import { AuditEvent, writeAuditLog } from './audit.service.js';

/**
 * @param {string} identifier
 * @param {boolean} success
 * @param {import('express').Request} req
 * @param {string} [userId]
 */
export async function recordLoginAttempt(identifier, success, req, userId = null) {
  const db = getDB();
  const device = getRequestDeviceInfo(req);

  await db.collection(Collections.LOGIN_ATTEMPTS).insertOne({
    identifier: String(identifier).toLowerCase(),
    userId,
    success,
    ip: device.ip,
    userAgent: device.userAgent,
    createdAt: new Date(),
  });

  await writeAuditLog({
    event: success ? AuditEvent.LOGIN_SUCCESS : AuditEvent.LOGIN_FAILED,
    userId,
    actorId: userId,
    metadata: { identifier },
    req,
  });
}

/**
 * @param {string} identifier
 * @returns {Promise<number>}
 */
export async function getRecentFailedAttempts(identifier) {
  const db = getDB();
  const since = new Date(Date.now() - authConfig.security.lockoutMinutes * 60_000);
  return db.collection(Collections.LOGIN_ATTEMPTS).countDocuments({
    identifier: String(identifier).toLowerCase(),
    success: false,
    createdAt: { $gte: since },
  });
}

/**
 * @param {object} user
 * @returns {boolean}
 */
export function isAccountLocked(user) {
  if (!user?.lockedUntil) return false;
  return new Date(user.lockedUntil) > new Date();
}

/**
 * @param {string} userId
 */
export async function lockAccount(userId, req) {
  const db = getDB();
  const lockedUntil = new Date(
    Date.now() + authConfig.security.lockoutMinutes * 60_000
  );
  await db.collection(Collections.USERS).updateOne(
    { id: userId },
    { $set: { lockedUntil } }
  );
  await writeAuditLog({
    event: AuditEvent.ACCOUNT_LOCKED,
    userId,
    metadata: { lockedUntil },
    req,
  });
}

/**
 * @param {string} userId
 */
export async function clearAccountLock(userId) {
  const db = getDB();
  await db.collection(Collections.USERS).updateOne(
    { id: userId },
    { $unset: { lockedUntil: '' } }
  );
}

/**
 * @param {object} user
 * @param {import('express').Request} req
 */
export async function recordLoginHistory(user, req) {
  const db = getDB();
  const device = getRequestDeviceInfo(req);
  const now = new Date();

  await db.collection(Collections.LOGIN_HISTORY).insertOne({
    userId: user.id,
    ip: device.ip,
    userAgent: device.userAgent,
    deviceLabel: device.deviceLabel,
    createdAt: now,
  });

  await db.collection(Collections.USERS).updateOne(
    { id: user.id },
    { $set: { lastLoginAt: now, lastLoginIp: device.ip } }
  );
}
