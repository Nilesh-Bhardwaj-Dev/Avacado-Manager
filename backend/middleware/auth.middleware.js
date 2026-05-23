/**
 * @file auth.middleware.js
 * @description JWT authentication via HttpOnly cookies or Authorization header.
 */
import { authConfig } from '../config/auth.config.js';
import { verifyAccessToken } from '../services/token.service.js';
import { getDB } from '../config/db.js';
import { Collections } from '../constants/collections.js';
import { sanitizeUser } from '../services/session.service.js';

/**
 * Extracts access token from cookie or Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractAccessToken(req) {
  const cookieToken = req.cookies?.[authConfig.cookies.accessName];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

/**
 * JWT authentication middleware — populates req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const payload = verifyAccessToken(token);
    if (!payload?.sub) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
    }

    const db = getDB();
    const user = await db.collection(Collections.USERS).findOne({ id: payload.sub });
    if (!user || user.status === 'inactive') {
      return res.status(401).json({ error: 'Unauthorized: Account inactive or not found.' });
    }

    req.user = sanitizeUser(user);
    req.auth = {
      sessionId: payload.sessionId,
      tokenPayload: payload,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attaches user if valid token present.
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      req.user = null;
      return next();
    }
    const payload = verifyAccessToken(token);
    if (!payload?.sub) {
      req.user = null;
      return next();
    }
    const db = getDB();
    const user = await db.collection(Collections.USERS).findOne({ id: payload.sub });
    req.user = user ? sanitizeUser(user) : null;
    next();
  } catch (err) {
    next(err);
  }
}

/** @deprecated Legacy in-memory sessions removed — use authenticate() */
export const sessions = {};
