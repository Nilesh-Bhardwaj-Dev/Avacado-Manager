import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAPI(API_ENDPOINTS.SUPERADMIN.AUDIT_LOGS);
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearLogs = async (range) => {
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

  return (
    <div className="sa-table-card">
      <div className="sa-table-header">
        <span className="sa-table-title">Audit Logs</span>
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
                <span className="activity-text">{log.text}</span>
                <span className="activity-time">
                  {log.workspace} · {formatTime(log)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
