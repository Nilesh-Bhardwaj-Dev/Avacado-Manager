import { emailLayout, escapeHtml, credentialsBox, primaryButton } from './base.template.js';

/**
 * Welcome email sent when a new account is created.
 */
export function welcomeEmailHtml({ name, email, username, password, accountRole, loginUrl }) {
  const roleLabel = accountRole === 'admin' ? 'Administrator' : 'Team Member';
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Welcome, ${escapeHtml(name)}!</h2>
    <p style="margin:0 0 16px;">Your <strong>${escapeHtml(roleLabel)}</strong> account has been created on Task Manager. Use the credentials below to sign in for the first time.</p>
    ${credentialsBox({ username: username || email, password, loginUrl })}
    ${primaryButton(loginUrl, 'Sign in to Task Manager')}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
      For security, change your password after your first login from your profile settings.
    </p>
  `;

  return emailLayout({
    title: 'Welcome to Task Manager',
    preheader: `Your ${roleLabel} account is ready — sign in with the credentials inside.`,
    bodyHtml,
  });
}

export function welcomeEmailSubject(name) {
  return `Welcome to Task Manager — your account is ready, ${name}`;
}
