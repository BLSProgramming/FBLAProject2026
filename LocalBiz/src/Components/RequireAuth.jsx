import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children, requiredUserType = null }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;
  const location = useLocation();

  if (!token && !userId) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    // if the user is authenticated but not the right type, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
