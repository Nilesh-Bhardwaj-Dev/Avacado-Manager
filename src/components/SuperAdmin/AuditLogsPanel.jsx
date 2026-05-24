import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, Trash2 } from 'lucide-react';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const currentOrganizationId = useSelector((state) => state.context.currentOrganizationId);

  const isSuper = user?.accountRole === 'superadmin';

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isSuper
        ? API_ENDPOINTS.SUPERADMIN.AUDIT_LOGS
        : API_ENDPOINTS.ORGANIZATIONS.AUDIT_LOGS(currentOrganizationId);
      
      const data = await fetchAPI(endpoint);
      setLogs(isSuper ? data : (data.logs || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSuper, currentOrganizationId]);

  useEffect(() => {
    if (isSuper || currentOrganizationId) {
      loadLogs();
    }
  }, [loadLogs, isSuper, currentOrganizationId]);

  const handleClearLogs = async (range) => {
    if (!isSuper) return;
    const rangeLabels = {
      all: 'all audit logs',
      'last-week': 'audit logs from the last week',
      'last-month': 'audit logs from the last month',
    };
    if (!window.confirm(`Are you sure you want to delete ${rangeLabels[range] || range}?`)) {
      return;
    }
    setShowDeleteMenu(false);
    setLoading(true);
    setError('');
    try {
      await fetchAPI(`${API_ENDPOINTS.SUPERADMIN.AUDIT_LOGS}?range=${range}`, { method: 'DELETE' });
      await loadLogs();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatTime = (log) => {
    if (log.createdAt) {
      return new Date(log.createdAt).toLocaleString();
    }
    return log.timestamp || '—';
  };

  const getLogText = (log) => {
    if (log.text) return log.text;

    const action = log.action || '';
    const metadata = log.metadata || {};
    const actorStr = log.actorName || log.actorEmail || 'System';

    switch (action) {
      case 'ORGANIZATION_CREATED':
        return `${actorStr} created the organization`;
      case 'ORGANIZATION_UPDATED':
        return `${actorStr} updated organization settings`;
      case 'ORGANIZATION_DELETED':
        return `${actorStr} deleted the organization`;
      case 'USER_INVITED':
        return `${actorStr} invited new user (${metadata.email || 'unknown email'}) with role: ${metadata.roleKey || 'member'}`;
      case 'MEMBER_ROLE_UPDATED':
        return `${actorStr} updated a member's role to ${metadata.roleId || 'custom'}`;
      case 'MEMBER_REMOVED':
        return `${actorStr} removed a member from the organization`;
      case 'PROJECT_CREATED':
        return `${actorStr} created project "${metadata.name || 'unnamed'}"`;
      case 'PROJECT_UPDATED':
        return `${actorStr} updated project settings`;
      case 'PROJECT_DELETED':
        return `${actorStr} deleted project`;
      default: {
        const cleanAction = action.toLowerCase().replace(/_/g, ' ');
        const capitalized = cleanAction.charAt(0).toUpperCase() + cleanAction.slice(1);
        return `${actorStr} performed: ${capitalized}`;
      }
    }
  };

  return (
    <div className="sa-table-card">
      <div className="sa-table-header">
        <span className="sa-table-title">Organization Audit Logs</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={loadLogs}
            disabled={loading}
            title="Refresh audit logs"
            style={{
              padding: '6px',
              borderRadius: '6px',
              height: '28px',
              width: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
          </button>
          
          {isSuper && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                title="Clear audit logs"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  height: '28px',
                  width: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--danger)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <Trash2 size={14} />
              </button>
              {showDeleteMenu && (
                <div className="activity-delete-dropdown" style={{ right: 0, top: '100%', marginTop: '4px' }}>
                  <button type="button" onClick={() => handleClearLogs('last-week')}>Delete Last Week</button>
                  <button type="button" onClick={() => handleClearLogs('last-month')}>Delete Last Month</button>
                  <button type="button" onClick={() => handleClearLogs('all')} style={{ color: 'var(--danger)' }}>
                    Delete All
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="profile-alert alert-danger" style={{ margin: '16px 24px 0' }}>
          {error}
        </div>
      )}

      {loading && logs.length === 0 ? (
        <div className="sa-empty"><p>Loading audit logs...</p></div>
      ) : logs.length === 0 ? (
        <div className="sa-empty"><p>No audit logs yet.</p></div>
      ) : (
        <div className="activity-feed-list" style={{ padding: '16px 24px 24px' }}>
          {logs.map((log) => (
            <div className="activity-item" key={log.id}>
              <div className="activity-marker" />
              <div className="activity-details">
                <span className="activity-text">{getLogText(log)}</span>
                <span className="activity-time">
                  {log.workspace || log.actorEmail || 'System'} · {formatTime(log)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
