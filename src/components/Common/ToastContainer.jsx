import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, X } from 'lucide-react';
import { removeToast } from '../../store/slices/notification.slice.js';

const TOAST_AUTO_DISMISS_MS = 4500;

function getToastIconClass(type) {
  const map = {
    TASK_ASSIGNED: 'info',
    TASK_UPDATED: 'warning',
    TASK_COMPLETED: 'success',
    COMMENT_ADDED: 'purple',
    DEPENDENCY_UNBLOCKED: 'info',
  };
  return map[type] || 'info';
}

function ToastItem({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <div className="toast">
      <div className={`toast-icon ${getToastIconClass(toast.type)}`}>
        <Bell size={16} />
      </div>
      <div className="toast-body">
        <strong>{toast.title}</strong>
        <span>{toast.message}</span>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={() => dispatch(removeToast(toast.id))}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector(state => state.notification.toasts);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
