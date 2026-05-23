/**
 * @file twoFactor.controller.js
 * @description TOTP 2FA HTTP handlers.
 */
import {
  generateTwoFactorSetup,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
} from '../services/twoFactor.service.js';
import { AuditEvent, writeAuditLog } from '../services/audit.service.js';

export async function setup2fa(req, res, next) {
  try {
    const setup = await generateTwoFactorSetup(req.user);
    res.json(setup);
  } catch (err) {
    next(err);
  }
}

export async function enable2fa(req, res, next) {
  try {
    const result = await verifyAndEnableTwoFactor(req.user.id, req.body.token);
    await writeAuditLog({
      event: AuditEvent.TWO_FACTOR_ENABLED,
      userId: req.user.id,
      actorId: req.user.id,
      req,
    });
    res.json({
      success: true,
      backupCodes: result.backupCodes,
      message: 'Two-factor authentication enabled. Store backup codes securely.',
    });
  } catch (err) {
    next(err);
  }
}

export async function disable2fa(req, res, next) {
  try {
    const { password } = req.body;
    const { verifyPassword } = await import('../services/password.service.js');
    const { getDB } = await import('../config/db.js');
    const { Collections } = await import('../constants/collections.js');
    const db = getDB();
    const user = await db.collection(Collections.USERS).findOne({ id: req.user.id });
    const { valid } = await verifyPassword(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Password is incorrect.' });
    }
    await disableTwoFactor(req.user.id);
    await writeAuditLog({
      event: AuditEvent.TWO_FACTOR_DISABLED,
      userId: req.user.id,
      actorId: req.user.id,
      req,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
