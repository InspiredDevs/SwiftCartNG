import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingBag, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface SellerStore {
  id: string;
  store_name: string;
  store_description: string | null;
  is_approved: boolean;
}

export default function SellerDashboard() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<SellerStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isSeller)) {
      navigate('/auth/login');
    }
  }, [user, isSeller, authLoading, navigate]);

  useEffect(() => {
    if (user && isSeller) {
      fetchStoreInfo();
    }
  }, [user, isSeller]);

  const fetchStoreInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_stores')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setStore(data);
    } catch (error) {
      console.error('Error fetching store:', error);
      toast.error('Failed to load store information');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Seller Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your products and store
            </p>
          </div>

          {store && !store.is_approved && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                  <AlertCircle className="h-5 w-5" />
                  Pending Approval
                </CardTitle>
                <CardDescription className="text-yellow-800 dark:text-yellow-200">
                  Your seller account is pending admin approval. You'll be able to add products once approved.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {store && store.is_approved && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <CheckCircle className="h-5 w-5" />
                  Account Approved
                </CardTitle>
                <CardDescription className="text-green-800 dark:text-green-200">
                  Your seller account is active! You can now add and manage products.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Store Name</p>
                  <p className="font-medium">{store?.store_name || 'N/A'}</p>
                </div>
                {store?.store_description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{store.store_description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {store?.is_approved ? 'Approved' : 'Pending Approval'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  disabled={!store?.is_approved}
                  onClick={() => navigate('/seller/products/new')}
                >
                  Add New Product
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/seller/products')}
                >
                  View My Products
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/seller/profile')}
                >
                  Edit Store Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {!store?.is_approved && (
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  While you wait for approval:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Prepare product images and descriptions</li>
                  <li>Review your store information</li>
                  <li>Check your email for approval notifications</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
