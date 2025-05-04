import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');

  // You can add expiry logic if needed
  return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;