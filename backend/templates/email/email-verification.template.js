import { emailLayout, escapeHtml, primaryButton } from './base.template.js';

/**
 * @param {object} params
 */
export function emailVerificationTemplate({ name, verifyUrl, appName }) {
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Verify your email</h2>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Please confirm your email address to access ${escapeHtml(appName)}.</p>
    ${primaryButton(verifyUrl, 'Verify email')}
    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">If you did not create an account, you can ignore this email.</p>
  `;
  return emailLayout({
    title: 'Email Verification',
    preheader: 'Verify your email address',
    bodyHtml,
  });
}
