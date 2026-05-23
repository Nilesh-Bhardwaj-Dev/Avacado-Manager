/**
 * @file email.service.js
 * @description Resend email delivery for transactional messages.
 */
import { Resend } from 'resend';
import {
  welcomeEmailHtml,
  welcomeEmailSubject,
} from '../templates/email/welcome.template.js';
import {
  passwordResetRequestHtml,
  passwordResetRequestSubject,
  passwordResetByAdminHtml,
  passwordResetByAdminSubject,
  passwordChangedHtml,
  passwordChangedSubject,
} from '../templates/email/password-reset.template.js';
import { otpEmailHtml, otpEmailSubject } from '../templates/email/otp.template.js';

let resendClient = null;

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
}

function getLoginUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Sends an email via Resend. Logs and returns false if email is not configured.
 * @returns {Promise<boolean>} true if sent successfully
 */
export async function sendEmail({ to, subject, html }) {
  const client = getClient();
  if (!client) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email:', subject, '→', to);
    return false;
  }

  try {
    const { data, error } = await client.emails.send({
      from: getFromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return false;
    }

    console.log('[Email] Sent:', subject, '→', to, data?.id ? `(id: ${data.id})` : '');
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
    return false;
  }
}

export async function sendWelcomeEmail({ name, email, username, password, accountRole }) {
  const loginUrl = getLoginUrl();
  return sendEmail({
    to: email,
    subject: welcomeEmailSubject(name),
    html: welcomeEmailHtml({
      name,
      email,
      username: username || email,
      password,
      accountRole,
      loginUrl,
    }),
  });
}

export async function sendPasswordResetLinkEmail({ name, email, resetUrl, expiresMinutes = 60 }) {
  return sendEmail({
    to: email,
    subject: passwordResetRequestSubject(),
    html: passwordResetRequestHtml({ name, resetUrl, expiresMinutes }),
  });
}

export async function sendAdminPasswordResetEmail({ name, email, username, newPassword }) {
  const loginUrl = getLoginUrl();
  return sendEmail({
    to: email,
    subject: passwordResetByAdminSubject(),
    html: passwordResetByAdminHtml({
      name,
      username: username || email,
      newPassword,
      loginUrl,
    }),
  });
}

export async function sendOtpEmail({ name, email, code, expiresMinutes = 2 }) {
  return sendEmail({
    to: email,
    subject: otpEmailSubject(),
    html: otpEmailHtml({ name, code, expiresMinutes }),
  });
}

export async function sendPasswordChangedEmail({ name, email }) {
  const loginUrl = getLoginUrl();
  return sendEmail({
    to: email,
    subject: passwordChangedSubject(),
    html: passwordChangedHtml({ name, loginUrl }),
  });
}

export { getLoginUrl };
