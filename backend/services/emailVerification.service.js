/**
 * @file emailVerification.service.js
 */
import crypto from 'crypto';
import { getDB } from '../config/db.js';
import { EmailVerificationTokenModel } from '../models/EmailVerificationToken.model.js';
import { authConfig } from '../config/auth.config.js';
import { rbacConfig } from '../config/rbac.config.js';
import { sendEmail } from './email.service.js';
import { emailVerificationTemplate } from '../templates/email/email-verification.template.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * @param {object} user
 */
export async function createEmailVerificationToken(user) {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(
    Date.now() + rbacConfig.emailVerificationExpiresHours * 60 * 60 * 1000
  );

  await EmailVerificationTokenModel.deleteMany({ userId: user.id, usedAt: null });

  await EmailVerificationTokenModel.create({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  return rawToken;
}

/**
 * @param {object} user
 */
export async function sendVerificationEmail(user) {
  const token = await createEmailVerificationToken(user);
  const verifyUrl = `${authConfig.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const html = emailVerificationTemplate({
    name: user.name,
    verifyUrl,
    appName: authConfig.appName,
  });

  await sendEmail({
    to: user.email,
    subject: `Verify your ${authConfig.appName} email`,
    html,
  });
}

/**
 * @param {string} rawToken
 */
export async function verifyEmailToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const record = await EmailVerificationTokenModel.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    const err = new Error('Invalid or expired verification token.');
    err.status = 400;
    throw err;
  }

  const db = getDB();
  await db.collection('users').updateOne(
    { id: record.userId },
    { $set: { emailVerified: true, emailVerifiedAt: new Date() } }
  );

  await EmailVerificationTokenModel.updateOne(
    { id: record.id },
    { $set: { usedAt: new Date() } }
  );

  return db.collection('users').findOne({ id: record.userId });
}

/**
 * @param {object} user
 */
export function isEmailVerified(user) {
  if (!rbacConfig.requireEmailVerification) return true;
  if (user.accountRole === 'superadmin') return true;
  return Boolean(user.emailVerified);
}
