/**
 * @file device.util.js
 * @description Extract device/session metadata from HTTP requests.
 */
/**
 * @param {import('express').Request} req
 * @returns {{ ip: string, userAgent: string, deviceLabel: string }}
 */
export function getRequestDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  let deviceLabel = 'Unknown device';
  if (/mobile/i.test(userAgent)) deviceLabel = 'Mobile';
  else if (/windows/i.test(userAgent)) deviceLabel = 'Windows';
  else if (/mac/i.test(userAgent)) deviceLabel = 'macOS';
  else if (/linux/i.test(userAgent)) deviceLabel = 'Linux';

  return { ip, userAgent, deviceLabel };
}
