import { useState, useEffect } from 'react';
import {
  MessageCircleQuestion,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  User,
  Filter,
} from 'lucide-react';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';

const STATUS_LABELS = {
  open: { label: 'Open', className: 'query-status-open' },
  in_progress: { label: 'In Progress', className: 'query-status-progress' },
  resolved: { label: 'Resolved', className: 'query-status-resolved' },
};

const CATEGORIES = {
  general: 'General',
  technical: 'Technical',
  account: 'Account',
  billing: 'Billing',
  other: 'Other',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function QueriesPanel() {
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    const queryParam = filter !== 'all' ? `?status=${filter}` : '';
    Promise.all([
      fetchAPI(`${API_ENDPOINTS.SUPERADMIN_QUERIES.BASE}${queryParam}`),
      fetchAPI(API_ENDPOINTS.SUPERADMIN_QUERIES.STATS),
    ])
      .then(([queriesData, statsData]) => {
        setQueries(queriesData);
        setStats(statsData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleStatusChange = (queryId, status) => {
    setUpdating(true);
    setError('');
    fetchAPI(API_ENDPOINTS.SUPERADMIN_QUERIES.DETAIL(queryId), {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
      .then(updated => {
        setSelectedQuery(updated);
        loadData();
      })
      .catch(err => setError(err.message))
      .finally(() => setUpdating(false));
  };

  const handleResolve = e => {
    e.preventDefault();
    if (!selectedQuery || !resolutionMessage.trim()) return;

    setUpdating(true);
    setError('');
    fetchAPI(API_ENDPOINTS.SUPERADMIN_QUERIES.DETAIL(selectedQuery.id), {
      method: 'PUT',
      body: JSON.stringify({ status: 'resolved', resolutionMessage }),
    })
      .then(updated => {
        setSelectedQuery(updated);
        setResolutionMessage('');
        loadData();
      })
      .catch(err => setError(err.message))
      .finally(() => setUpdating(false));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="query-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="query-stat-card">
          <div className="query-stat-value">{stats.total}</div>
          <div className="query-stat-label">Total</div>
        </div>
        <div className="query-stat-card open">
          <div className="query-stat-value">{stats.open}</div>
          <div className="query-stat-label">Open</div>
        </div>
        <div className="query-stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="query-stat-value" style={{ color: '#f59e0b' }}>
            {stats.inProgress}
          </div>
          <div className="query-stat-label">In Progress</div>
        </div>
        <div className="query-stat-card resolved">
          <div className="query-stat-value">{stats.resolved}</div>
          <div className="query-stat-label">Resolved</div>
        </div>
      </div>

      <div className="sa-table-card">
        <div className="sa-table-header">
          <span className="sa-table-title">
            <MessageCircleQuestion size={18} style={{ marginRight: '8px' }} />
            Support Queries ({queries.length})
          </span>
          <div className="query-filter-bar">
            <Filter size={14} />
            <select
              className="form-control"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="query-alert error" style={{ margin: '16px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="query-loading">
            <Loader2 size={24} className="spin" /> Loading queries...
          </div>
        ) : queries.length === 0 ? (
          <div className="sa-empty">
            <div className="sa-empty-icon">
              <MessageCircleQuestion size={26} />
            </div>
            <p>No queries found for this filter.</p>
          </div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Raised By</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queries.map(q => {
                const st = STATUS_LABELS[q.status] || STATUS_LABELS.open;
                return (
                  <tr key={q.id}>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{q.subject}</span>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {q.message}
                      </p>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        <strong>{q.raisedBy?.name}</strong>
                        <br />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {q.raisedBy?.accountRole} · {q.raisedBy?.email}
                        </span>
                      </div>
                    </td>
                    <td>{CATEGORIES[q.category] || q.category}</td>
                    <td>
                      <span className={`query-priority priority-${q.priority}`}>{q.priority}</span>
                    </td>
                    <td>
                      <span className={`query-status-badge ${st.className}`}>{st.label}</span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <Clock size={12} style={{ marginRight: '4px' }} />
                      {formatDate(q.createdAt)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                        onClick={() => {
                          setSelectedQuery(q);
                          setResolutionMessage(q.resolution?.message || '');
                          setError('');
                        }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedQuery && (
        <div className="modal-overlay" onClick={() => setSelectedQuery(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{selectedQuery.subject}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedQuery(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="query-alert error" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="query-detail-meta" style={{ marginBottom: '16px' }}>
                <span className="query-detail-raiser">
                  <User size={14} /> {selectedQuery.raisedBy?.name} ({selectedQuery.raisedBy?.accountRole})
                </span>
                <span className="query-card-category">
                  {CATEGORIES[selectedQuery.category]}
                </span>
                <span className={`query-priority priority-${selectedQuery.priority}`}>
                  {selectedQuery.priority}
                </span>
                <span className="query-card-date">
                  <Clock size={12} /> {formatDate(selectedQuery.createdAt)}
                </span>
              </div>

              <div className="query-detail-section">
                <h4>Query Message</h4>
                <p>{selectedQuery.message}</p>
              </div>

              {selectedQuery.status !== 'resolved' && (
                <div style={{ marginTop: '20px' }}>
                  <label className="form-label">Update Status</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {selectedQuery.status !== 'open' && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={updating}
                        onClick={() => handleStatusChange(selectedQuery.id, 'open')}
                      >
                        Mark Open
                      </button>
                    )}
                    {selectedQuery.status !== 'in_progress' && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={updating}
                        onClick={() => handleStatusChange(selectedQuery.id, 'in_progress')}
                      >
                        In Progress
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleResolve}>
                    <div className="form-group">
                      <label className="form-label">Resolution Message *</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={resolutionMessage}
                        onChange={e => setResolutionMessage(e.target.value)}
                        placeholder="Enter resolution details for the user..."
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={updating}>
                      {updating ? (
                        <Loader2 size={15} className="spin" />
                      ) : (
                        <>
                          <CheckCircle size={15} style={{ marginRight: '6px' }} /> Mark Resolved
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {selectedQuery.resolution && (
                <div className="query-resolution-box" style={{ marginTop: '20px' }}>
                  <h4>
                    <CheckCircle size={16} /> Resolution
                  </h4>
                  <p>{selectedQuery.resolution.message}</p>
                  <span className="query-resolution-meta">
                    Resolved on {formatDate(selectedQuery.resolution.resolvedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
