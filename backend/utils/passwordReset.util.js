/**
 * @file passwordReset.util.js
 * @description Token storage and validation for self-service password reset.
 */
import crypto from 'crypto';
import { getDB } from '../config/db.js';

const COLLECTION = 'password_reset_tokens';
const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a password reset token for a user. Replaces any existing unused tokens.
 */
export async function createPasswordResetToken(userId, email) {
  const db = getDB();
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MS);

  await db.collection(COLLECTION).deleteMany({ userId, used: false });

  await db.collection(COLLECTION).insertOne({
    token,
    userId,
    email: email.toLowerCase(),
    expiresAt,
    used: false,
    createdAt: new Date(),
  });

  return { token, expiresAt, expiresMinutes: RESET_EXPIRY_MS / 60000 };
}

/**
 * Validates token and returns the associated user id, or null.
 */
export async function consumePasswordResetToken(token) {
  if (!token) return null;

  const db = getDB();
  const record = await db.collection(COLLECTION).findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return null;

  await db.collection(COLLECTION).updateOne(
    { token },
    { $set: { used: true, usedAt: new Date() } }
  );

  return record.userId;
}

export function buildResetUrl(token) {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/?resetToken=${encodeURIComponent(token)}`;
}
