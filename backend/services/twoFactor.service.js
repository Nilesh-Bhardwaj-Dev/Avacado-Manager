/**
 * @file twoFactor.service.js
 * @description TOTP 2FA setup, verification, and backup codes.
 */
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { getDB } from '../config/db.js';
import { Collections } from '../constants/collections.js';
import { authConfig } from '../config/auth.config.js';
import { hashPassword, verifyPassword } from './password.service.js';

const BACKUP_CODE_COUNT = 10;

/**
 * @param {object} user
 * @returns {Promise<{ secret: string, otpauthUrl: string, qrCodeDataUrl: string }>}
 */
export async function generateTwoFactorSetup(user) {
  const secret = speakeasy.generateSecret({
    name: `${authConfig.appName} (${user.email})`,
    issuer: authConfig.appName,
    length: 32,
  });

  const db = getDB();
  await db.collection(Collections.USERS).updateOne(
    { id: user.id },
    {
      $set: {
        'twoFactor.pendingSecret': secret.base32,
        'twoFactor.enabled': false,
      },
    }
  );

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeDataUrl,
  };
}

/**
 * @param {string} userId
 * @param {string} token
 * @returns {Promise<{ enabled: boolean, backupCodes: string[] }>}
 */
export async function verifyAndEnableTwoFactor(userId, token) {
  const db = getDB();
  const user = await db.collection(Collections.USERS).findOne({ id: userId });
  const secret = user?.twoFactor?.pendingSecret;
  if (!secret) {
    const err = new Error('2FA setup not started.');
    err.status = 400;
    throw err;
  }

  const valid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!valid) {
    const err = new Error('Invalid authenticator code.');
    err.status = 400;
    throw err;
  }

  const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  const hashedBackupCodes = await Promise.all(
    backupCodes.map((c) => hashPassword(c))
  );

  await db.collection(Collections.USERS).updateOne(
    { id: userId },
    {
      $set: {
        'twoFactor.enabled': true,
        'twoFactor.secret': secret,
        'twoFactor.backupCodes': hashedBackupCodes,
        'twoFactor.enabledAt': new Date(),
      },
      $unset: { 'twoFactor.pendingSecret': '' },
    }
  );

  return { enabled: true, backupCodes };
}

/**
 * @param {object} user
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function verifyTwoFactorToken(user, token) {
  if (!user?.twoFactor?.enabled || !user.twoFactor.secret) return false;

  const normalized = String(token).replace(/\s/g, '');
  const totpValid = speakeasy.totp.verify({
    secret: user.twoFactor.secret,
    encoding: 'base32',
    token: normalized,
    window: 1,
  });
  if (totpValid) return true;

  for (const hashed of user.twoFactor.backupCodes || []) {
    const { valid } = await verifyPassword(normalized, hashed);
    if (valid) {
      await consumeBackupCode(user.id, hashed);
      return true;
    }
  }
  return false;
}

/**
 * @param {string} userId
 * @param {string} usedHash
 */
async function consumeBackupCode(userId, usedHash) {
  const db = getDB();
  await db.collection(Collections.USERS).updateOne(
    { id: userId },
    { $pull: { 'twoFactor.backupCodes': usedHash } }
  );
}

/**
 * @param {string} userId
 */
export async function disableTwoFactor(userId) {
  const db = getDB();
  await db.collection(Collections.USERS).updateOne(
    { id: userId },
    {
      $set: { 'twoFactor.enabled': false },
      $unset: {
        'twoFactor.secret': '',
        'twoFactor.pendingSecret': '',
        'twoFactor.backupCodes': '',
      },
    }
  );
}
