/**
 * @file auth.service.js
 * @description Core authentication business logic.
 */
import { getDB } from '../config/db.js';
import { Collections } from '../constants/collections.js';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  isPasswordReused,
  appendPasswordHistory,
} from './password.service.js';
import {
  createSession,
  rotateRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  sanitizeUser,
  getSessionIdFromRefreshToken,
} from './session.service.js';
import {
  recordLoginAttempt,
  getRecentFailedAttempts,
  isAccountLocked,
  lockAccount,
  clearAccountLock,
  recordLoginHistory,
} from './loginSecurity.service.js';
import { verifyTwoFactorToken } from './twoFactor.service.js';
import { signTemp2faToken } from './token.service.js';
import { setCsrfCookie } from './token.service.js';
import { authConfig } from '../config/auth.config.js';
import { AuditEvent, writeAuditLog } from './audit.service.js';
import { logActivity } from '../utils/activity.util.js';
import { consumePasswordResetToken, createPasswordResetToken } from '../utils/passwordReset.util.js';
import { verifyOtp } from '../utils/otp.util.js';
import { sendPasswordChangedEmail, sendPasswordResetLinkEmail } from './email.service.js';
import { isEmailVerified } from './emailVerification.service.js';

/**
 * @param {string} loginId
 * @returns {Promise<object|null>}
 */
async function findUserByIdentifier(loginId) {
  const db = getDB();
  const id = String(loginId).trim().toLowerCase();
  return db.collection(Collections.USERS).findOne({
    $or: [{ email: id }, { username: id }],
  });
}

/**
 * @param {object} user
 * @param {string} ownerId
 */
async function logWorkspaceSignIn(user, ownerId) {
  await logActivity(`${user.name} signed in to the workspace`, ownerId);
}

function resolveOwnerId(user) {
  if (user.accountRole === 'admin') return user.id;
  if (user.accountRole === 'superadmin') return 'superadmin';
  return user.managedBy;
}

/**
 * @param {{ identifier: string, password: string, totpCode?: string }} credentials
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function login(credentials, req, res) {
  const { identifier, password, totpCode } = credentials;
  const loginId = String(identifier).trim();

  const failed = await getRecentFailedAttempts(loginId);
  if (failed >= authConfig.security.maxLoginAttempts) {
    const err = new Error('Too many failed login attempts. Try again later.');
    err.status = 429;
    throw err;
  }

  const user = await findUserByIdentifier(loginId);

  if (!user || !user.password) {
    await recordLoginAttempt(loginId, false, req);
    const err = new Error('Invalid credentials.');
    err.status = 401;
    throw err;
  }

  if (isAccountLocked(user)) {
    const err = new Error('Account is temporarily locked. Try again later.');
    err.status = 423;
    throw err;
  }

  if (user.status === 'inactive') {
    const err = new Error('Your account has been deactivated.');
    err.status = 403;
    throw err;
  }

  if (!isEmailVerified(user)) {
    const err = new Error('Please verify your email before signing in.');
    err.status = 403;
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  const { valid, needsUpgrade } = await verifyPassword(password, user.password);
  if (!valid) {
    await recordLoginAttempt(loginId, false, req, user.id);
    const attempts = await getRecentFailedAttempts(loginId);
    if (attempts >= authConfig.security.maxLoginAttempts) {
      await lockAccount(user.id, req);
    }
    const err = new Error('Invalid credentials.');
    err.status = 401;
    throw err;
  }

  if (user.twoFactor?.enabled) {
    if (!totpCode) {
      const tempToken = signTemp2faToken({ sub: user.id, purpose: '2fa_pending' });
      return {
        requires2FA: true,
        tempToken,
        message: 'Two-factor authentication required.',
      };
    }
    const totpOk = await verifyTwoFactorToken(user, totpCode);
    if (!totpOk) {
      await recordLoginAttempt(loginId, false, req, user.id);
      const err = new Error('Invalid two-factor code.');
      err.status = 401;
      throw err;
    }
  }

  const db = getDB();
  if (needsUpgrade) {
    const newHash = await hashPassword(password);
    await db.collection(Collections.USERS).updateOne(
      { id: user.id },
      {
        $set: {
          password: newHash,
          passwordUpgradedAt: new Date(),
        },
      }
    );
    user.password = newHash;
  }

  await clearAccountLock(user.id);
  await recordLoginAttempt(loginId, true, req, user.id);
  await recordLoginHistory(user, req);

  const userClean = sanitizeUser(user);
  await createSession(userClean, req, res);
  setCsrfCookie(res);

  const ownerId = resolveOwnerId(user);
  await logWorkspaceSignIn(user, ownerId);

  return { user: userClean, requires2FA: false };
}

/**
 * Complete login after 2FA step.
 */
export async function complete2faLogin(tempToken, totpCode, req, res) {
  const { verifyTemp2faToken } = await import('./token.service.js');
  const payload = verifyTemp2faToken(tempToken);
  if (!payload?.sub) {
    const err = new Error('Invalid or expired 2FA session.');
    err.status = 401;
    throw err;
  }

  const db = getDB();
  const user = await db.collection(Collections.USERS).findOne({ id: payload.sub });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const totpOk = await verifyTwoFactorToken(user, totpCode);
  if (!totpOk) {
    const err = new Error('Invalid two-factor code.');
    err.status = 401;
    throw err;
  }

  if (!isEmailVerified(user)) {
    const err = new Error('Please verify your email before signing in.');
    err.status = 403;
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  await recordLoginHistory(user, req);
  const userClean = sanitizeUser(user);
  await createSession(userClean, req, res);
  setCsrfCookie(res);
  await logWorkspaceSignIn(user, resolveOwnerId(user));
  return { user: userClean };
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function refreshSession(req, res) {
  const refreshToken = req.cookies?.[authConfig.cookies.refreshName];
  if (!refreshToken) {
    const err = new Error('Refresh token missing.');
    err.status = 401;
    throw err;
  }
  const result = await rotateRefreshToken(refreshToken, req, res);
  await writeAuditLog({
    event: AuditEvent.TOKEN_REFRESH,
    userId: result.user.id,
    actorId: result.user.id,
    req,
  });
  return result;
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {'current'|'all'} scope
 */
export async function logout(req, res, scope = 'current') {
  const user = req.user;
  const refreshToken = req.cookies?.[authConfig.cookies.refreshName];

  if (scope === 'all' && user?.id) {
    await revokeAllUserSessions(user.id);
    await writeAuditLog({
      event: AuditEvent.LOGOUT_ALL,
      userId: user.id,
      actorId: user.id,
      req,
    });
  } else if (refreshToken) {
    const sessionId = await getSessionIdFromRefreshToken(refreshToken);
    if (sessionId) await revokeSession(sessionId);
    await writeAuditLog({
      event: AuditEvent.LOGOUT,
      userId: user?.id,
      actorId: user?.id,
      req,
    });
  }

  const { clearAuthCookies } = await import('./token.service.js');
  clearAuthCookies(res);
  return { success: true };
}

/**
 * @param {string} email
 * @param {import('express').Request} req
 */
export async function forgotPassword(email) {
  const genericMessage =
    'If an account exists for that email, you will receive reset instructions shortly.';
  const emailLower = String(email).trim().toLowerCase();
  const db = getDB();
  const user = await db.collection(Collections.USERS).findOne({
    email: emailLower,
    password: { $ne: null },
    status: { $ne: 'inactive' },
  });

  if (user) {
    const { token, expiresMinutes } = await createPasswordResetToken(user.id, user.email);
    const resetUrl = `${authConfig.appUrl}/?resetToken=${encodeURIComponent(token)}`;
    await sendPasswordResetLinkEmail({
      name: user.name,
      email: user.email,
      resetUrl,
      expiresMinutes,
    });
  }

  return { success: true, message: genericMessage };
}

/**
 * @param {object} params
 */
export async function resetPassword(params, req) {
  const { token, email, otp, newPassword } = params;
  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    const err = new Error(strength.errors[0]);
    err.status = 400;
    throw err;
  }

  const db = getDB();
  let userId;

  if (email && otp) {
    const record = await verifyOtp(email, otp);
    if (!record) {
      const err = new Error('Invalid or expired verification code.');
      err.status = 400;
      throw err;
    }
    userId = record.userId;
    if (!userId) {
      const byEmail = await db.collection(Collections.USERS).findOne({ email: record.email });
      userId = byEmail?.id;
    }
  } else if (token) {
    userId = await consumePasswordResetToken(token);
    if (!userId) {
      const err = new Error('Reset link is invalid or expired.');
      err.status = 400;
      throw err;
    }
  } else {
    const err = new Error('Provide reset token or email with OTP.');
    err.status = 400;
    throw err;
  }

  const user = await db.collection(Collections.USERS).findOne({ id: userId });
  if (!user || user.status === 'inactive') {
    const err = new Error('Account not found or inactive.');
    err.status = 400;
    throw err;
  }

  if (await isPasswordReused(newPassword, user.passwordHistory || [])) {
    const err = new Error('Cannot reuse a recent password.');
    err.status = 400;
    throw err;
  }

  const newHash = await hashPassword(newPassword);
  const passwordHistory = appendPasswordHistory(user.password, user.passwordHistory || []);

  await db.collection(Collections.USERS).updateOne(
    { id: userId },
    { $set: { password: newHash, passwordHistory, passwordChangedAt: new Date() } }
  );

  await revokeAllUserSessions(userId);
  await sendPasswordChangedEmail({ name: user.name, email: user.email });
  await writeAuditLog({
    event: AuditEvent.PASSWORD_RESET,
    userId,
    actorId: userId,
    req,
  });
  await logActivity(`${user.name} reset their password`, resolveOwnerId(user));

  return { success: true, message: 'Password reset successful. Please sign in.' };
}

/**
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @param {import('express').Request} req
 */
export async function changePassword(userId, currentPassword, newPassword, req) {
  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    const err = new Error(strength.errors[0]);
    err.status = 400;
    throw err;
  }

  const db = getDB();
  const user = await db.collection(Collections.USERS).findOne({ id: userId });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const { valid } = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    const err = new Error('Incorrect current password.');
    err.status = 400;
    throw err;
  }

  if (await isPasswordReused(newPassword, user.passwordHistory || [])) {
    const err = new Error('Cannot reuse a recent password.');
    err.status = 400;
    throw err;
  }

  const newHash = await hashPassword(newPassword);
  const passwordHistory = appendPasswordHistory(user.password, user.passwordHistory || []);

  await db.collection(Collections.USERS).updateOne(
    { id: userId },
    { $set: { password: newHash, passwordHistory, passwordChangedAt: new Date() } }
  );

  await writeAuditLog({
    event: AuditEvent.PASSWORD_CHANGE,
    userId,
    actorId: userId,
    req,
  });
  await logActivity(`${user.name} changed their account password`, resolveOwnerId(user));

  return { success: true };
}

/**
 * Hash password for admin-created accounts.
 * @param {string} plainPassword
 */
export async function hashPasswordForStorage(plainPassword) {
  const strength = validatePasswordStrength(plainPassword);
  if (!strength.valid) {
    const err = new Error(strength.errors.join(' '));
    err.status = 400;
    throw err;
  }
  return hashPassword(plainPassword);
}
