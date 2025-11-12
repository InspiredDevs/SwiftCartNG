import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSeller?: boolean;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSeller = false,
  requireAuth = false
}: ProtectedRouteProps) {
  const { user, isAdmin, isSeller, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireSeller && !isSeller) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
