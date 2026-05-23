import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPasswordRequest } from '../../store/slices/auth.slice.js';

export default function ResetPassword({ resetToken, onBack, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [done, setDone] = useState(false);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.');
      return;
    }

    dispatch(
      resetPasswordRequest({
        token: resetToken,
        password,
        onSuccess: () => {
          setDone(true);
          window.history.replaceState({}, '', window.location.pathname);
        },
      })
    );
  };

  const displayError = localError || error;

  if (done) {
    return (
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-card-header">
            <CheckCircle size={48} style={{ color: '#22c55e', margin: '0 auto 12px' }} />
            <h1 className="login-card-title">Password updated</h1>
            <p className="login-card-subtitle">You can now sign in with your new password.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onComplete}
            style={{ width: '100%', height: '44px' }}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-card-header">
          <div className="logo-icon">PM</div>
          <h1 className="login-card-title">Set new password</h1>
          <p className="login-card-subtitle">Choose a strong password for your account</p>
        </div>

        {displayError && (
          <div className="login-error" role="alert">
            <span style={{ marginRight: '6px' }}>⚠</span>
            {displayError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> New password
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Confirm password
            </label>
            <input
              type="password"
              className="form-control"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !resetToken}
            style={{ width: '100%', height: '44px' }}
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

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
