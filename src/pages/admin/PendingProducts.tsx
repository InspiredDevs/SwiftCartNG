import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  stock_quantity: number;
  status: string;
  seller_stores: {
    store_name: string;
  };
}

export default function PendingProducts() {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch seller stores separately
      const productsWithStores = await Promise.all(
        (productsData || []).map(async (product) => {
          if (product.seller_id) {
            const { data: storeData } = await supabase
              .from('seller_stores')
              .select('store_name')
              .eq('user_id', product.seller_id)
              .maybeSingle();

            return {
              ...product,
              seller_stores: storeData || { store_name: 'Unknown Seller' }
            };
          }
          return { ...product, seller_stores: { store_name: 'SwiftCart Official' } };
        })
      );

      setProducts(productsWithStores || []);
    } catch (error) {
      console.error('Error fetching pending products:', error);
      toast.error('Failed to load pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'approved' })
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product approved successfully');
      fetchPendingProducts();
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Failed to approve product');
    }
  };

  const handleReject = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'rejected' })
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product rejected');
      fetchPendingProducts();
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Failed to reject product');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pending Product Approvals</h1>
          <p className="text-muted-foreground">Review and approve seller product submissions</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading pending products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No pending products to review</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="aspect-square rounded-lg bg-muted mb-4 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Seller: <span className="font-medium">{product.seller_stores?.store_name}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleApprove(product.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReject(product.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
