import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { resetPasswordRequest } from '../../store/slices/auth.slice.js';

const UI_TIMER_SECONDS = 60;

export default function EnterOtpReset({ email, onBack, onComplete }) {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(UI_TIMER_SECONDS);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);
  const dispatch = useDispatch();

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (secondsLeft <= 0) {
      setLocalError('Code expired on screen. You may still have up to 2 minutes — try submitting, or request a new code.');
    }

    if (otp.length !== 6) {
      setLocalError('Enter the 6-digit code from your email.');
      return;
    }
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
        email,
        otp,
        password,
        onSuccess: () => {
          if (onComplete) onComplete();
          else onBack();
        },
      })
    );
  };

  const displayError = localError || error;
  const timerDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-card-header">
          <div className="logo-icon">PM</div>
          <h1 className="login-card-title">Enter verification code</h1>
          <p className="login-card-subtitle">
            Code sent to <strong>{email}</strong>
          </p>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginBottom: '16px',
            padding: '10px',
            borderRadius: '8px',
            background: secondsLeft > 10 ? 'rgba(37,99,235,0.12)' : 'rgba(239,68,68,0.12)',
            color: secondsLeft > 10 ? '#60a5fa' : '#f87171',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {secondsLeft > 0 ? (
            <>Enter code within: {timerDisplay}</>
          ) : (
            <>Timer ended — code may still work for 1 more minute on the server</>
          )}
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
              <KeyRound size={14} /> 6-digit code
            </label>
            <input
              type="text"
              className="form-control"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '1.2rem' }}
            />
          </div>
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
            <label className="form-label">Confirm password</label>
            <input
              type="password"
              className="form-control"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', height: '44px' }}
          >
            {loading ? 'Updating...' : 'Reset password'}
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
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    </div>
  );
}
