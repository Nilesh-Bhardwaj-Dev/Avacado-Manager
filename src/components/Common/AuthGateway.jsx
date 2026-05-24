import { useMemo } from 'react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './Login.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';
import EnterOtpReset from './EnterOtpReset.jsx';

/**
 * Unauthenticated auth flows: sign in, forgot password, reset via email link.
 */
export default function AuthGateway() {
  const user = useSelector((state) => state.auth.user);

  const resetTokenFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('resetToken') || '';
  }, []);

  const [view, setView] = useState(resetTokenFromUrl ? 'reset' : 'login');
  const [otpEmail, setOtpEmail] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (view === 'forgot') {
    return (
      <ForgotPassword
        onBack={() => setView('login')}
        onOtpSent={(email) => {
          setOtpEmail(email);
          setView('otp-reset');
        }}
      />
    );
  }

  if (view === 'otp-reset' && otpEmail) {
    return (
      <EnterOtpReset
        email={otpEmail}
        onBack={() => setView('forgot')}
        onComplete={() => setView('login')}
      />
    );
  }

  if (view === 'reset' && resetTokenFromUrl) {
    return (
      <ResetPassword
        resetToken={resetTokenFromUrl}
        onBack={() => setView('login')}
        onComplete={() => setView('login')}
      />
    );
  }

  return <Login onForgotPassword={() => setView('forgot')} />;
}
