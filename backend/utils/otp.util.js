/**
 * @file otp.util.js
 * @description OTP generation, storage, verification, and log retention (max 20).
 */
import crypto from 'crypto';
import { getDB } from '../config/db.js';

export const OTP_COLLECTION = 'otp_logs';
/** Backend validity — 2 minutes */
export const OTP_TTL_MS = 2 * 60 * 1000;
/** Shown on UI countdown — 1 minute */
export const OTP_UI_SECONDS = 60;
export const MAX_OTP_LOGS = 20;

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Removes expired logs and keeps only the newest MAX_OTP_LOGS entries.
 */
export async function pruneOtpLogs(db) {
  const col = db.collection(OTP_COLLECTION);
  await col.deleteMany({ expiresAt: { $lt: new Date() } });

  const excess = await col.countDocuments();
  if (excess <= MAX_OTP_LOGS) return;

  const toRemove = await col
    .find({})
    .sort({ createdAt: 1 })
    .limit(excess - MAX_OTP_LOGS)
    .project({ _id: 1 })
    .toArray();

  if (toRemove.length > 0) {
    await col.deleteMany({ _id: { $in: toRemove.map((d) => d._id) } });
  }
}

/**
 * Creates an OTP log entry and returns the plain code (for email / superadmin view).
 */
export async function createOtpLog({
  email,
  userId = null,
  userName = null,
  purpose = 'password_reset',
  sentBy = 'system',
  sentByName = 'System',
}) {
  const db = getDB();
  const code = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  const doc = {
    id: `otp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    code,
    email: email.trim().toLowerCase(),
    userId,
    userName,
    purpose,
    sentBy,
    sentByName,
    createdAt: now,
    expiresAt,
    used: false,
    usedAt: null,
  };

  await db.collection(OTP_COLLECTION).insertOne(doc);
  await pruneOtpLogs(db);

  return { code, logId: doc.id, expiresAt };
}

/**
 * Validates OTP for an email. Marks as used on success.
 */
export async function verifyOtp(email, code) {
  const db = getDB();
  const emailLower = email.trim().toLowerCase();
  const normalizedCode = String(code).trim();

  const record = await db.collection(OTP_COLLECTION).findOne({
    email: emailLower,
    code: normalizedCode,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return null;

  await db.collection(OTP_COLLECTION).updateOne(
    { id: record.id },
    { $set: { used: true, usedAt: new Date() } }
  );

  return record;
}

export async function listOtpLogsForSuperAdmin() {
  const db = getDB();
  await pruneOtpLogs(db);

  const logs = await db
    .collection(OTP_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .limit(MAX_OTP_LOGS)
    .toArray();

  const now = Date.now();
  return logs.map((log) => ({
    id: log.id,
    code: log.code,
    email: log.email,
    userName: log.userName,
    purpose: log.purpose,
    sentBy: log.sentBy,
    sentByName: log.sentByName,
    createdAt: log.createdAt,
    expiresAt: log.expiresAt,
    used: log.used,
    expired: new Date(log.expiresAt).getTime() < now,
    remainingSeconds: Math.max(
      0,
      Math.ceil((new Date(log.expiresAt).getTime() - now) / 1000)
    ),
  }));
}
