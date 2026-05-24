import { useSelector } from 'react-redux';

/**
 * @param {string|string[]} permission
 * @param {{ any?: boolean }} options - any: true = require any permission
 */
export function usePermission(permission, options = {}) {
  const permissions = useSelector((s) => s.context.permissions);
  const user = useSelector((s) => s.auth.user);
  if (!permission) return true;
  const required = Array.isArray(permission) ? permission : [permission];

  if (user?.isPlatformAdmin) return true;
  if (permissions.includes('*')) return true;

  if (options.any) {
    return required.some((p) => permissions.includes(p));
  }
  return required.every((p) => permissions.includes(p));
}

export function usePermissions() {
  return useSelector((s) => s.context.permissions);
}
