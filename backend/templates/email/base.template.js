/**
 * Shared HTML email layout for Task Manager transactional emails.
 */

const APP_NAME = process.env.APP_NAME || 'Task Manager';

export function emailLayout({ title, preheader, bodyHtml }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;color:#f1f5f9;">${escapeHtml(preheader || title)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:28px 32px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:12px;background:rgba(255,255,255,0.2);color:#fff;font-weight:700;font-size:18px;">PM</div>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:600;">${escapeHtml(APP_NAME)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#334155;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px;">
              &copy; ${year} ${escapeHtml(APP_NAME)}. This is an automated message — please do not reply.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function primaryButton(href, label) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px;background:#2563eb;">
        <a href="${href}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function credentialsBox({ username, password, loginUrl }) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"
         style="margin:20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
    <tr>
      <td style="padding:20px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Your login credentials</p>
        <p style="margin:0 0 8px;"><strong style="color:#0f172a;">Username:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:14px;">${escapeHtml(username)}</code></p>
        <p style="margin:0 0 8px;"><strong style="color:#0f172a;">Password:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:14px;">${escapeHtml(password)}</code></p>
        ${loginUrl ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b;">Sign in at: <a href="${loginUrl}" style="color:#2563eb;">${escapeHtml(loginUrl)}</a></p>` : ''}
      </td>
    </tr>
  </table>`;
}
