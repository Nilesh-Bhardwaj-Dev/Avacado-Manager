import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Lock } from 'lucide-react';
import { loginRequest } from '../../store/slices/auth.slice.js';

export default function Login({ onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const loading = useSelector(state => state.auth.loading);
  const error = useSelector(state => state.auth.error);
  const requires2FA = useSelector(state => state.auth.requires2FA);
  const temp2faToken = useSelector(state => state.auth.temp2faToken);

  const dispatch = useDispatch();

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    dispatch(loginRequest({
      email: email.trim(),
      password,
      totpCode: requires2FA ? totpCode : undefined,
      tempToken: requires2FA ? temp2faToken : undefined,
    }));
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-card-header">
          <div className="logo-icon">PM</div>
          <h1 className="login-card-title">Task Manager</h1>
          <p className="login-card-subtitle">Enterprise workspace — sign in to continue</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span style={{ marginRight: '6px' }}>⚠</span>{error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Username or Email
            </label>
            <input
              id="login-email"
              type="text"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin or your.name@company.com"
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              disabled={requires2FA}
            />
          </div>

          {requires2FA && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Authenticator code</label>
              <input
                type="text"
                className="form-control"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\s/g, ''))}
                placeholder="6-digit code"
                required
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </div>
          )}

          <button
            type="submit"
            id="login-submit-btn"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', height: '44px', fontSize: '0.95rem', position: 'relative' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span className="login-spinner" />
                Authenticating...
              </span>
            ) : 'Sign In'}
          </button>

          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary, #2563eb)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textAlign: 'center',
                padding: 0,
              }}
            >
              Forgot your password?
            </button>
          )}
        </form>

        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Lock size={10} />
          Password encrypted with SHA-256 before transmission
        </div>
      </div>
    </div>
  );
}
