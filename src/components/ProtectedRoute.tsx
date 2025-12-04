import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSeller?: boolean;
  requireCustomer?: boolean;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSeller = false,
  requireCustomer = false,
  requireAuth = false
}: ProtectedRouteProps) {
  const { user, isAdmin, isSeller, isCustomer, sellerStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check if user is authenticated
  if ((requireAuth || requireAdmin || requireSeller || requireCustomer) && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check admin role
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check seller role and approval status
  if (requireSeller) {
    if (!isSeller) {
      return <Navigate to="/" replace />;
    }
    // Redirect pending sellers to pending-approval page
    if (sellerStatus === 'pending') {
      return <Navigate to="/seller/pending-approval" replace />;
    }
  }

  // Check customer role - sellers and admins cannot access customer-only pages
  if (requireCustomer && !isCustomer) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
