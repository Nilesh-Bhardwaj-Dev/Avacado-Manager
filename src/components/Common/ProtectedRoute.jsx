import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePermission } from '../../hooks/usePermission.js';

export default function ProtectedRoute({
  children,
  permission = null,
  anyPermission = false,
  roles = null,
}) {
  const user = useSelector((s) => s.auth.user);
  const allowed = usePermission(permission, { any: anyPermission });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.accountRole)) {
    return <Navigate to="/" replace />;
  }

  if (permission && !allowed) {
    return (
      <div className="p-8 text-center text-slate-500">
        You do not have permission to access this page.
      </div>
    );
  }

  return children;
}
