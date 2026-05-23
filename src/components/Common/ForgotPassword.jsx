import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPasswordRequest } from '../../store/slices/auth.slice.js';

export default function ForgotPassword({ onBack, onOtpSent }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    dispatch(
      forgotPasswordRequest({
        email: email.trim(),
        onSuccess: () => {
          setSent(true);
          if (onOtpSent) {
            onOtpSent(email.trim());
          }
        },
      })
    );
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-card-header">
          <div className="logo-icon">PM</div>
          <h1 className="login-card-title">Forgot password</h1>
          <p className="login-card-subtitle">
            Enter your account email and we&apos;ll send you a reset link
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span style={{ marginRight: '6px' }}>⚠</span>
            {error}
          </div>
        )}

        {sent ? (
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-secondary, #f0fdf4)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            }}
          >
            <p style={{ margin: 0, marginBottom: '12px' }}>
              If an account exists for <strong>{email}</strong>, a 6-digit code was sent. Check your
              inbox and spam folder.
            </p>
            {onOtpSent && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => onOtpSent(email.trim())}
              >
                Enter verification code
              </button>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> Email address
              </label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', height: '44px' }}
            >
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={onBack}
          style={{
            marginTop: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary, #2563eb)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Back to sign in
        </button>
      </div>
    </div>
  );
}
