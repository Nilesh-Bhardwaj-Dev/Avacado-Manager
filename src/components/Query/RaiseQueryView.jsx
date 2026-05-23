import { useState, useEffect } from 'react';
import {
  MessageCircleQuestion,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Send,
  Inbox,
} from 'lucide-react';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'account', label: 'Account & Access' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_LABELS = {
  open: { label: 'Open', className: 'query-status-open' },
  in_progress: { label: 'In Progress', className: 'query-status-progress' },
  resolved: { label: 'Resolved', className: 'query-status-resolved' },
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

function QueryDetailModal({ query, onClose }) {
  const st = STATUS_LABELS[query.status] || STATUS_LABELS.open;

  return (
    <div className="modal-content detail-modal-width" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">{query.subject}</h2>
        <button type="button" className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">
        <div className="query-detail-meta">
          <span className={`query-status-badge ${st.className}`}>{st.label}</span>
          <span className={`query-priority priority-${query.priority}`}>{query.priority} priority</span>
          <span className="query-card-category">
            {CATEGORIES.find(c => c.value === query.category)?.label}
          </span>
          <span className="query-card-date">
            <Clock size={12} /> {formatDate(query.createdAt)}
          </span>
        </div>
        <div className="query-detail-section">
          <h4>Your Message</h4>
          <p>{query.message}</p>
        </div>
        {query.resolution && (
          <div className="query-resolution-box">
            <h4>
              <CheckCircle size={16} /> Super Admin Resolution
            </h4>
            <p>{query.resolution.message}</p>
            <span className="query-resolution-meta">
              Resolved by {query.resolution.resolvedBy?.name} on{' '}
              {formatDate(query.resolution.resolvedAt)}
            </span>
          </div>
        )}
        {query.status !== 'resolved' && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              marginTop: '16px',
              fontStyle: 'italic',
            }}
          >
            Your query is being reviewed by the Super Admin. You will be notified when it is
            resolved.
          </p>
        )}
      </div>
    </div>
  );
}

export default function RaiseQueryView() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');

  const loadQueries = () => {
    setLoading(true);
    fetchAPI(API_ENDPOINTS.QUERIES.BASE)
      .then(setQueries)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setCategory('general');
    setPriority('medium');
    setError('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    fetchAPI(API_ENDPOINTS.QUERIES.BASE, {
      method: 'POST',
      body: JSON.stringify({ subject, message, category, priority }),
    })
      .then(() => {
        setSuccess('Your query has been submitted to the Super Admin.');
        resetForm();
        setShowForm(false);
        loadQueries();
        setTimeout(() => setSuccess(''), 4000);
      })
      .catch(err => setError(err.message))
      .finally(() => setSubmitting(false));
  };

  const openCount = queries.filter(
    q => q.status === 'open' || q.status === 'in_progress'
  ).length;
  const resolvedCount = queries.filter(q => q.status === 'resolved').length;

  return (
    <section className="view-section query-view">
      <div className="query-page-header">
        <h1 className="query-page-title">
          <MessageCircleQuestion size={24} /> Raise Query
        </h1>
        <p className="query-page-subtitle">
          Submit questions or issues directly to the Super Admin for resolution
        </p>
      </div>

      {success && (
        <div className="query-alert success">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && !showForm && (
        <div className="query-alert error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="query-stats-grid">
        <div className="query-stat-card">
          <div className="query-stat-value">{queries.length}</div>
          <div className="query-stat-label">Total Queries</div>
        </div>
        <div className="query-stat-card open">
          <div className="query-stat-value">{openCount}</div>
          <div className="query-stat-label">Pending</div>
        </div>
        <div className="query-stat-card resolved">
          <div className="query-stat-value">{resolvedCount}</div>
          <div className="query-stat-label">Resolved</div>
        </div>
      </div>

      <div className="query-toolbar">
        <h2 className="query-section-title">
          <Inbox size={18} /> My Queries
        </h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setError('');
          }}
        >
          <Plus size={15} style={{ marginRight: '6px' }} /> Raise New Query
        </button>
      </div>

      {loading ? (
        <div className="query-loading">
          <Loader2 size={24} className="spin" /> Loading queries...
        </div>
      ) : queries.length === 0 ? (
        <div className="query-empty">
          <MessageCircleQuestion size={40} />
          <p>No queries yet. Need help? Raise a query and the Super Admin will respond.</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            Raise Your First Query
          </button>
        </div>
      ) : (
        <div className="query-list">
          {queries.map(q => {
            const st = STATUS_LABELS[q.status] || STATUS_LABELS.open;
            return (
              <div
                key={q.id}
                className="query-card"
                onClick={() => setSelectedQuery(q)}
                onKeyDown={e => e.key === 'Enter' && setSelectedQuery(q)}
                role="button"
                tabIndex={0}
              >
                <div className="query-card-top">
                  <span className={`query-status-badge ${st.className}`}>{st.label}</span>
                  <span className={`query-priority priority-${q.priority}`}>{q.priority}</span>
                </div>
                <h3 className="query-card-subject">{q.subject}</h3>
                <p className="query-card-preview">{q.message}</p>
                <div className="query-card-footer">
                  <span className="query-card-category">
                    {CATEGORIES.find(c => c.value === q.category)?.label || q.category}
                  </span>
                  <span className="query-card-date">
                    <Clock size={12} /> {formatDate(q.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '560px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                <Send size={20} style={{ marginRight: '8px' }} /> Raise New Query
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="query-alert error" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="query-subject">
                    Subject *
                  </label>
                  <input
                    id="query-subject"
                    type="text"
                    className="form-control"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Brief summary of your query"
                    required
                    maxLength={200}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="query-category">
                      Category
                    </label>
                    <select
                      id="query-category"
                      className="form-control"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="query-priority">
                      Priority
                    </label>
                    <select
                      id="query-priority"
                      className="form-control"
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="query-message">
                    Message *
                  </label>
                  <textarea
                    id="query-message"
                    className="form-control"
                    rows={5}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your query in detail..."
                    required
                  />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Your query will be sent to the Super Admin for review and resolution.
                </p>
              </div>
              <div
                className="modal-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="spin" style={{ marginRight: '6px' }} />{' '}
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={15} style={{ marginRight: '6px' }} /> Submit Query
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQuery && (
        <div className="modal-overlay" onClick={() => setSelectedQuery(null)}>
          <QueryDetailModal query={selectedQuery} onClose={() => setSelectedQuery(null)} />
        </div>
      )}
    </section>
  );
}
