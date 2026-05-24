import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGateway from './components/Common/AuthGateway.jsx';
import VerifyEmailPage from './components/Common/VerifyEmailPage.jsx';
import MainWorkspace from './MainWorkspace.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthGateway />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/" element={<MainWorkspace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
