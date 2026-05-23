import { emailLayout, escapeHtml, primaryButton } from './base.template.js';

/**
 * Self-service password reset link email.
 */
export function passwordResetRequestHtml({ name, resetUrl, expiresMinutes }) {
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Reset your password</h2>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">We received a request to reset the password for your Task Manager account. Click the button below to choose a new password.</p>
    ${primaryButton(resetUrl, 'Reset password')}
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Or copy this link into your browser:</p>
    <p style="margin:0 0 16px;word-break:break-all;font-size:13px;"><a href="${resetUrl}" style="color:#2563eb;">${escapeHtml(resetUrl)}</a></p>
    <p style="margin:0;font-size:13px;color:#94a3b8;">This link expires in ${expiresMinutes} minutes. If you did not request a reset, you can safely ignore this email.</p>
  `;

  return emailLayout({
    title: 'Reset your password',
    preheader: 'Click the link to reset your Task Manager password.',
    bodyHtml,
  });
}

export function passwordResetRequestSubject() {
  return 'Reset your Task Manager password';
}

/**
 * Email sent when an administrator sets a new password for the user.
 */
export function passwordResetByAdminHtml({ name, username, newPassword, loginUrl }) {
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Your password was reset</h2>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">An administrator has reset your Task Manager account password. Use the new credentials below to sign in.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
           style="margin:20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 8px;"><strong>Username:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;">${escapeHtml(username)}</code></p>
          <p style="margin:0;"><strong>New password:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;">${escapeHtml(newPassword)}</code></p>
        </td>
      </tr>
    </table>
    ${primaryButton(loginUrl, 'Sign in now')}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">If you did not expect this change, contact your workspace administrator immediately.</p>
  `;

  return emailLayout({
    title: 'Your password was reset',
    preheader: 'An administrator reset your password — new credentials inside.',
    bodyHtml,
  });
}

export function passwordResetByAdminSubject() {
  return 'Your Task Manager password was reset';
}

/**
 * Confirmation after user completes self-service reset.
 */
export function passwordChangedHtml({ name, loginUrl }) {
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Password updated</h2>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Your Task Manager password was changed successfully. You can now sign in with your new password.</p>
    ${primaryButton(loginUrl, 'Sign in to Task Manager')}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">If you did not make this change, contact your administrator right away.</p>
  `;

  return emailLayout({
    title: 'Password changed',
    preheader: 'Your password was updated successfully.',
    bodyHtml,
  });
}

export function passwordChangedSubject() {
  return 'Your Task Manager password was changed';
}
