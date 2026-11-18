import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface Props {
  children: JSX.Element;
  allowIncomplete?: boolean;
}

const PrivateRoute = ({ children, allowIncomplete = false }: Props) => {
  const { login, user } = useAuth();
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get('/auth/verify');
        // Sync stored user with the latest server state (role, onboarding_complete, etc.)
        login(localStorage.getItem('authToken')!, res.data.user);
        setStatus('valid');
      } catch {
        setStatus('invalid');
      }
    };
    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'checking') return null;
  if (status === 'invalid') return <Navigate to="/login" replace />;

  // Redirect incomplete users to onboarding unless they're already there
  if (!allowIncomplete && user && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default PrivateRoute;
