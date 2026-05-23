/**
 * @file session.service.js
 * @description Refresh token persistence, rotation, and device session management.
 */
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/db.js';
import { Collections } from '../constants/collections.js';
import { authConfig } from '../config/auth.config.js';
import {
  generateOpaqueRefreshToken,
  hashRefreshToken,
  signAccessToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from './token.service.js';
import { getRequestDeviceInfo } from '../utils/device.util.js';

/**
 * @param {object} user - sanitized user document
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<{ accessToken: string, sessionId: string }>}
 */
export async function createSession(user, req, res) {
  const db = getDB();
  const refreshToken = generateOpaqueRefreshToken();
  const sessionId = uuidv4();
  const familyId = uuidv4();
  const device = getRequestDeviceInfo(req);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + authConfig.jwt.refreshExpiresMs);

  await db.collection(Collections.REFRESH_TOKENS).insertOne({
    sessionId,
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    familyId,
    device,
    createdAt: now,
    lastUsedAt: now,
    expiresAt,
    revokedAt: null,
  });

  const accessToken = signAccessToken({
    sub: user.id,
    sessionId,
    accountRole: user.accountRole,
    email: user.email,
  });

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);

  return { accessToken, sessionId };
}

/**
 * Rotates refresh token — invalidates old token and issues new pair.
 * @param {string} refreshToken
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function rotateRefreshToken(refreshToken, req, res) {
  const db = getDB();
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await db.collection(Collections.REFRESH_TOKENS).findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    const err = new Error('Invalid or expired refresh token.');
    err.status = 401;
    throw err;
  }

  const user = await db.collection(Collections.USERS).findOne({ id: session.userId });
  if (!user || user.status === 'inactive') {
    await revokeSession(session.sessionId);
    const err = new Error('Account inactive or not found.');
    err.status = 403;
    throw err;
  }

  // Revoke current token (rotation)
  await db.collection(Collections.REFRESH_TOKENS).updateOne(
    { sessionId: session.sessionId },
    { $set: { revokedAt: new Date(), revokeReason: 'rotated' } }
  );

  const newRefreshToken = generateOpaqueRefreshToken();
  const newSessionId = uuidv4();
  const now = new Date();
  const device = getRequestDeviceInfo(req);

  await db.collection(Collections.REFRESH_TOKENS).insertOne({
    sessionId: newSessionId,
    userId: session.userId,
    tokenHash: hashRefreshToken(newRefreshToken),
    familyId: session.familyId,
    device,
    createdAt: now,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + authConfig.jwt.refreshExpiresMs),
    revokedAt: null,
    rotatedFrom: session.sessionId,
  });

  const userClean = sanitizeUser(user);
  const accessToken = signAccessToken({
    sub: user.id,
    sessionId: newSessionId,
    accountRole: user.accountRole,
    email: user.email,
  });

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, newRefreshToken);

  return { user: userClean, accessToken };
}

/**
 * @param {string} sessionId
 */
export async function revokeSession(sessionId) {
  const db = getDB();
  await db.collection(Collections.REFRESH_TOKENS).updateOne(
    { sessionId },
    { $set: { revokedAt: new Date(), revokeReason: 'logout' } }
  );
}

/**
 * @param {string} userId
 */
export async function revokeAllUserSessions(userId) {
  const db = getDB();
  await db.collection(Collections.REFRESH_TOKENS).updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokeReason: 'logout_all' } }
  );
}

/**
 * @param {string} refreshToken
 * @returns {Promise<string|null>} sessionId
 */
export async function getSessionIdFromRefreshToken(refreshToken) {
  const db = getDB();
  const session = await db.collection(Collections.REFRESH_TOKENS).findOne({
    tokenHash: hashRefreshToken(refreshToken),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  return session?.sessionId || null;
}

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function listUserSessions(userId) {
  const db = getDB();
  return db
    .collection(Collections.REFRESH_TOKENS)
    .find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .project({ tokenHash: 0 })
    .sort({ lastUsedAt: -1 })
    .toArray();
}

/**
 * @param {object} user
 * @returns {object}
 */
export function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username || '',
    name: user.name,
    role: user.role,
    team: user.team,
    avatar: user.avatar,
    bio: user.bio || '',
    accountRole: user.accountRole || 'admin',
    status: user.status || 'active',
    maxUsers: user.maxUsers ?? null,
    managedBy: user.managedBy ?? null,
    twoFactorEnabled: Boolean(user.twoFactor?.enabled),
    lastLoginAt: user.lastLoginAt || null,
  };
}
