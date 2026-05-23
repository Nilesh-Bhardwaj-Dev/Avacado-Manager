import { emailLayout, escapeHtml } from './base.template.js';

export function otpEmailHtml({ name, code, expiresMinutes }) {
  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Your verification code</h2>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 20px;">Use this one-time code to complete your request:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;background:#eff6ff;padding:16px 28px;border-radius:12px;border:2px dashed #93c5fd;">
        ${escapeHtml(code)}
      </span>
    </div>
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">
      This code expires in ${expiresMinutes} minutes. Do not share it with anyone.
    </p>
  `;

  return emailLayout({
    title: 'Your verification code',
    preheader: `Your code is ${code}`,
    bodyHtml,
  });
}

export function otpEmailSubject() {
  return 'Your Task Manager verification code';
}
