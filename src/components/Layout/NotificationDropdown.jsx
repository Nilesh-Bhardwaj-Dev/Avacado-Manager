import { useSelector, useDispatch } from 'react-redux';
import { Bell } from 'lucide-react';
import { markReadRequest, markAllReadRequest } from '../../store/slices/notification.slice.js';

export default function NotificationDropdown() {
  const notifications = useSelector(state => state.notification.notifications);
  const unreadCount = useSelector(state => state.notification.unreadCount);
  const showNotifPanel = useSelector(state => state.notification.showNotifPanel);
  const dispatch = useDispatch();

  if (!showNotifPanel) return null;

  const handleMarkRead = (notifId, isRead) => {
    if (!isRead) {
      dispatch(markReadRequest(notifId));
    }
  };

  const getNotifIcon = (type) => {
    const map = {
      TASK_ASSIGNED: 'task-assigned',
      TASK_UPDATED: 'task-updated',
      TASK_COMPLETED: 'task-completed',
      COMMENT_ADDED: 'comment-added',
      DEPENDENCY_UNBLOCKED: 'dep-unblocked',
    };
    return map[type] || 'task-assigned';
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="notification-panel">
      <div className="notif-panel-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button className="notif-mark-all" onClick={() => dispatch(markAllReadRequest())}>
            Mark all read
          </button>
        )}
      </div>
      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <Bell size={28} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notif-item ${!n.read ? 'unread' : ''}`}
              onClick={() => handleMarkRead(n.id, n.read)}
            >
              <div className={`notif-icon ${getNotifIcon(n.type)}`}>
                <Bell size={16} />
              </div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-message">{n.message}</div>
                <div className="notif-time">{formatTimeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
