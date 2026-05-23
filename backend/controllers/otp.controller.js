/**
 * @file otp.controller.js
 * @description Super Admin OTP send & log viewing.
 */
import { getDB } from '../config/db.js';
import { createOtpLog, listOtpLogsForSuperAdmin, OTP_UI_SECONDS } from '../utils/otp.util.js';
import { sendOtpEmail } from '../services/email.service.js';
import { logActivity } from '../utils/activity.util.js';

/**
 * GET /api/superadmin/otp/logs
 * Returns the last 20 OTP logs (newest first).
 */
export async function listOtpLogs(req, res, next) {
  try {
    const logs = await listOtpLogsForSuperAdmin();
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/superadmin/otp/send
 * Super Admin manually sends an OTP to a user's email.
 */
export async function sendOtp(req, res, next) {
  try {
    const { email, purpose = 'password_reset' } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailLower = String(email).trim().toLowerCase();
    const db = getDB();
    const user = await db.collection('users').findOne({
      email: emailLower,
      password: { $ne: null },
      status: { $ne: 'inactive' },
    });

    if (!user) {
      return res.status(404).json({ error: 'No active account found for this email.' });
    }

    const { code } = await createOtpLog({
      email: user.email,
      userId: user.id,
      userName: user.name,
      purpose,
      sentBy: req.user.id,
      sentByName: req.user.name,
    });

    await sendOtpEmail({
      name: user.name,
      email: user.email,
      code,
      expiresMinutes: 2,
    });

    await logActivity(
      `Super Admin sent OTP to '${user.name}' (${user.email})`,
      'superadmin'
    );

    res.json({
      success: true,
      message: `OTP sent to ${user.email}.`,
      uiExpiresIn: OTP_UI_SECONDS,
      email: user.email,
      userName: user.name,
    });
  } catch (err) {
    next(err);
  }
}
