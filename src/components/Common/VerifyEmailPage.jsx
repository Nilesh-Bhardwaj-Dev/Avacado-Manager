import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchAPI } from '../../api/api.service.js';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'loading' : 'missing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchAPI('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-semibold mb-4">Email Verification</h1>
        {status === 'loading' && <p>Verifying your email…</p>}
        {status === 'success' && (
          <>
            <p className="text-green-600 mb-4">{message}</p>
            <Link to="/login" className="text-blue-600 underline">
              Sign in
            </Link>
          </>
        )}
        {status === 'error' && <p className="text-red-600">{message}</p>}
        {status === 'missing' && <p className="text-slate-600">No verification token provided.</p>}
      </div>
    </div>
  );
}
