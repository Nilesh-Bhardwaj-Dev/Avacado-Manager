import { usePermission } from '../../hooks/usePermission.js';

/**
 * Renders children only when user has permission(s).
 */
export default function Can({ permission, any = false, children, fallback = null }) {
  const allowed = usePermission(permission, { any });
  if (!allowed) return fallback;
  return children;
}
