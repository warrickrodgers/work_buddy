import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../lib/api'; // your Axios instance

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        await api.get('/auth/verify'); // This should hit your backend verify endpoint
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    };

    checkToken();
  }, []);

  if (isValid === null) return null; // Or a loading spinner

  return isValid ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
