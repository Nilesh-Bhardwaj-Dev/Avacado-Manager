/**
 * @file token.service.js
 * @description JWT access/refresh token creation and verification.
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authConfig } from '../config/auth.config.js';

const baseSignOptions = {
  issuer: authConfig.jwt.issuer,
  audience: authConfig.jwt.audience,
};

/**
 * @param {object} payload
 * @returns {string}
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, authConfig.jwt.accessSecret, {
    ...baseSignOptions,
    expiresIn: authConfig.jwt.accessExpiresIn,
  });
}

/**
 * Short-lived token used only between password login and 2FA verification.
 * @param {object} payload
 * @returns {string}
 */
export function signTemp2faToken(payload) {
  return jwt.sign(
    { ...payload, purpose: '2fa_pending' },
    authConfig.jwt.accessSecret,
    { ...baseSignOptions, expiresIn: authConfig.jwt.temp2faExpiresIn }
  );
}

/**
 * @param {string} token
 * @returns {object|null}
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, authConfig.jwt.accessSecret, baseSignOptions);
  } catch {
    return null;
  }
}

/**
 * @param {string} token
 * @returns {object|null}
 */
export function verifyTemp2faToken(token) {
  try {
    const payload = jwt.verify(token, authConfig.jwt.accessSecret, baseSignOptions);
    if (payload.purpose !== '2fa_pending') return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates opaque refresh token (stored hashed in MongoDB).
 * @returns {string}
 */
export function generateOpaqueRefreshToken() {
  return crypto.randomBytes(authConfig.security.refreshTokenBytes).toString('base64url');
}

/**
 * @param {string} refreshToken
 * @returns {string}
 */
export function hashRefreshToken(refreshToken) {
  return crypto.createHash('sha256').update(refreshToken).digest('hex');
}

/**
 * @param {import('express').Response} res
 * @param {string} accessToken
 */
export function setAccessTokenCookie(res, accessToken) {
  res.cookie(authConfig.cookies.accessName, accessToken, {
    httpOnly: true,
    secure: authConfig.cookies.secure,
    sameSite: authConfig.cookies.sameSite,
    domain: authConfig.cookies.domain,
    path: authConfig.cookies.path,
    maxAge: authConfig.jwt.accessExpiresMs,
  });
}

/**
 * @param {import('express').Response} res
 * @param {string} refreshToken
 */
export function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(authConfig.cookies.refreshName, refreshToken, {
    httpOnly: true,
    secure: authConfig.cookies.secure,
    sameSite: authConfig.cookies.sameSite,
    domain: authConfig.cookies.domain,
    path: '/api/auth',
    maxAge: authConfig.jwt.refreshExpiresMs,
  });
}

/**
 * @param {import('express').Response} res
 */
export function clearAuthCookies(res) {
  const opts = {
    httpOnly: true,
    secure: authConfig.cookies.secure,
    sameSite: authConfig.cookies.sameSite,
    domain: authConfig.cookies.domain,
  };
  res.clearCookie(authConfig.cookies.accessName, { ...opts, path: authConfig.cookies.path });
  res.clearCookie(authConfig.cookies.refreshName, { ...opts, path: '/api/auth' });
  res.clearCookie(authConfig.cookies.csrfName, { ...opts, path: authConfig.cookies.path });
}

/**
 * @param {import('express').Response} res
 * @returns {string}
 */
export function setCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(authConfig.cookies.csrfName, token, {
    httpOnly: false,
    secure: authConfig.cookies.secure,
    sameSite: authConfig.cookies.sameSite,
    domain: authConfig.cookies.domain,
    path: authConfig.cookies.path,
    maxAge: authConfig.jwt.refreshExpiresMs,
  });
  return token;
}
