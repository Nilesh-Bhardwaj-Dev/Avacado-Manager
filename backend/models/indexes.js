/**
 * @file indexes.js
 * @description Ensures MongoDB indexes for auth-related collections.
 */
import { Collections } from '../constants/collections.js';
import { logger } from '../utils/logger.js';

/**
 * @param {import('mongodb').Db} db
 */
export async function ensureAuthIndexes(db) {
  await db.collection(Collections.REFRESH_TOKENS).createIndexes([
    { key: { tokenHash: 1 }, unique: true },
    { key: { userId: 1 } },
    { key: { sessionId: 1 }, unique: true },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ]);

  await db.collection(Collections.SECURITY_AUDIT_LOGS).createIndexes([
    { key: { createdAt: -1 } },
    { key: { userId: 1, createdAt: -1 } },
    { key: { event: 1, createdAt: -1 } },
  ]);

  await db.collection(Collections.LOGIN_ATTEMPTS).createIndexes([
    { key: { identifier: 1, createdAt: -1 } },
    { key: { createdAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 },
  ]);

  await db.collection(Collections.LOGIN_HISTORY).createIndexes([
    { key: { userId: 1, createdAt: -1 } },
  ]);

  await db.collection(Collections.PASSWORD_RESET_TOKENS).createIndexes([
    { key: { token: 1 }, unique: true },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ]);

  await db.collection(Collections.USERS).createIndexes([
    { key: { email: 1 } },
    { key: { username: 1 } },
    { key: { id: 1 }, unique: true },
  ]);

  logger.info('Auth MongoDB indexes ensured');
}
