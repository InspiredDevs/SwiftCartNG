import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SellerHeader from '@/components/seller/SellerHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

interface SellerOrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface SellerOrder {
  id: string;
  order_code: string;
  status: string;
  created_at: string;
  items: SellerOrderItem[];
}

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSellerOrders();
    }
  }, [user]);

  const fetchSellerOrders = async () => {
    try {
      // First, get the seller's products
      const { data: sellerProducts, error: productsError } = await supabase
        .from('products')
        .select('name')
        .eq('seller_id', user?.id);

      if (productsError) throw productsError;

      if (!sellerProducts || sellerProducts.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const productNames = sellerProducts.map(p => p.name);

      // Get all orders with their items
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_code,
          status,
          created_at,
          order_items (
            product_name,
            quantity,
            product_price,
            subtotal
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Filter orders that contain seller's products and map to include only seller's items
      const sellerOrders: SellerOrder[] = [];
      
      for (const order of allOrders || []) {
        const sellerItems = (order.order_items as SellerOrderItem[]).filter(
          item => productNames.includes(item.product_name)
        );
        
        if (sellerItems.length > 0) {
          sellerOrders.push({
            id: order.id,
            order_code: order.order_code,
            status: order.status || 'pending',
            created_at: order.created_at,
            items: sellerItems
          });
        }
      }

      setOrders(sellerOrders);
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'paid':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SellerHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading orders...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SellerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">
              View orders containing your products
            </p>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground">
                  When customers purchase your products, their orders will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Orders ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.order_code}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.product_name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
