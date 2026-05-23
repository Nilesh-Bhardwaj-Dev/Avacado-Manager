import { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';

export default function OtpLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendEmail, setSendEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAPI(API_ENDPOINTS.SUPERADMIN.OTP_LOGS);
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 15000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!sendEmail.trim()) return;
    setSending(true);
    setMessage('');
    setError('');
    try {
      const res = await fetchAPI(API_ENDPOINTS.SUPERADMIN.OTP_SEND, {
        method: 'POST',
        body: JSON.stringify({ email: sendEmail.trim(), purpose: 'password_reset' }),
      });
      setMessage(res.message || 'OTP sent successfully.');
      setSendEmail('');
      await loadLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="sa-table-card">
        <div className="sa-table-header">
          <span className="sa-table-title">Send OTP</span>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {message && (
            <div className="profile-alert" style={{ marginBottom: '12px', color: '#22c55e' }}>
              <CheckCircle size={16} /> {message}
            </div>
          )}
          {error && (
            <div className="profile-alert alert-danger" style={{ marginBottom: '12px' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSendOtp} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> User email
              </label>
              <input
                type="email"
                className="form-control"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="user@company.com"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending}
              style={{ alignSelf: 'flex-end', height: '42px' }}
            >
              <Send size={15} style={{ marginRight: '6px' }} />
              {sending ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', marginBottom: 0 }}>
            Codes expire after 2 minutes on the server. Users see a 1-minute countdown in the UI.
            Only the last 20 OTP logs are kept.
          </p>
        </div>
      </div>

      <div className="sa-table-card">
        <div className="sa-table-header">
          <span className="sa-table-title">OTP Logs (last 20)</span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 12px' }}
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </button>
        </div>
        {loading && logs.length === 0 ? (
          <div className="sa-empty"><p>Loading OTP logs...</p></div>
        ) : logs.length === 0 ? (
          <div className="sa-empty"><p>No OTP logs yet.</p></div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Email</th>
                <th>User</th>
                <th>Sent by</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <code
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        letterSpacing: '3px',
                        color: log.expired || log.used ? 'var(--text-muted)' : '#60a5fa',
                      }}
                    >
                      {log.code}
                    </code>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{log.email}</td>
                  <td>{log.userName || '—'}</td>
                  <td style={{ fontSize: '0.78rem' }}>{log.sentByName || log.sentBy}</td>
                  <td style={{ fontSize: '0.78rem' }}>{formatTime(log.createdAt)}</td>
                  <td>
                    {log.used ? (
                      <span className="status-badge status-active" style={{ fontSize: '0.72rem' }}>
                        <CheckCircle size={12} style={{ marginRight: '4px' }} /> Used
                      </span>
                    ) : log.expired ? (
                      <span className="status-badge status-inactive" style={{ fontSize: '0.72rem' }}>
                        <XCircle size={12} style={{ marginRight: '4px' }} /> Expired
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {log.remainingSeconds}s left
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
