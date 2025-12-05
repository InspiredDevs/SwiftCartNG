import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Store, Package, Plus, LayoutDashboard, HeadphonesIcon } from 'lucide-react';
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
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/seller/dashboard" className="flex items-center gap-2">
                <Store className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Seller Portal</span>
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