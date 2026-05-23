/**
 * @file auth.controller.js
 * @description HTTP handlers for authentication (thin controller layer).
 */
import * as authService from '../services/auth.service.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import { verifyAccessToken } from '../services/token.service.js';
import { authConfig } from '../config/auth.config.js';
import { sanitizeUser } from '../services/session.service.js';
import { getDB } from '../config/db.js';
import { Collections } from '../constants/collections.js';
import { listUserSessions } from '../services/session.service.js';

export async function login(req, res, next) {
  try {
    const identifier = req.body.identifier || req.body.email;
    const result = await authService.login(
      { identifier, password: req.body.password, totpCode: req.body.totpCode },
      req,
      res
    );
    if (result.requires2FA) {
      return res.json({
        requires2FA: true,
        tempToken: result.tempToken,
        message: result.message,
      });
    }
    res.json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function verify2faLogin(req, res, next) {
  try {
    const result = await authService.complete2faLogin(
      req.body.tempToken,
      req.body.totpCode,
      req,
      res
    );
    res.json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const result = await authService.refreshSession(req, res);
    res.json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const result = await authService.logout(req, res, 'current');
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req, res, next) {
  try {
    const result = await authService.logout(req, res, 'all');
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSession(req, res, next) {
  try {
    const token =
      req.cookies?.[authConfig.cookies.accessName] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) return res.json({ user: null });

    const payload = verifyAccessToken(token);
    if (!payload?.sub) return res.json({ user: null });

    const db = getDB();
    const user = await db.collection(Collections.USERS).findOne({ id: payload.sub });
    if (!user || user.status === 'inactive') return res.json({ user: null });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body.email, req);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordWithToken(req, res, next) {
  try {
    const result = await authService.resetPassword(
      {
        token: req.body.token,
        email: req.body.email,
        otp: req.body.otp,
        newPassword: req.body.newPassword,
      },
      req
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listSessions(req, res, next) {
  try {
    const sessions = await listUserSessions(req.user.id);
    res.json(
      sessions.map((s) => ({
        sessionId: s.sessionId,
        device: s.device,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt,
        current: s.sessionId === req.auth?.sessionId,
      }))
    );
  } catch (err) {
    next(err);
  }
}

export { optionalAuthenticate };
