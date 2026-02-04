import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Store, Package, Plus, LayoutDashboard, HeadphonesIcon, DollarSign, ShoppingBag, BarChart3 } from 'lucide-react';
import LogoutConfirmDialog from '@/components/LogoutConfirmDialog';

export default function SellerHeader() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <>
      <header className="border-b bg-emerald-500/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/seller/dashboard" className="flex items-center gap-2">
                <div className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded">
                  SELLER
                </div>
                <Store className="h-6 w-6 text-emerald-600" />
                <span className="text-xl font-bold">SwiftCart NG</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link 
                  to="/seller/dashboard" 
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link 
                  to="/seller/products" 
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Package className="h-4 w-4" />
                  My Products
                </Link>
                <Link 
                  to="/seller/products/new" 
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Link>
                <Link 
                  to="/seller/orders" 
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Orders
                </Link>
                <Link 
                  to="/seller/earnings" 
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  Earnings
                </Link>
                <Link 
                  to="/seller/analytics" 
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
                <Link 
                  to="/seller/support" 
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HeadphonesIcon className="h-4 w-4" />
                  Support
                </Link>
              </nav>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
      />
    </>
  );
}