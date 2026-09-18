import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function RequireRole({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <main className="page"><h1>Access restricted</h1><p>This page requires an {role} account.</p></main>;
  return children;
}
