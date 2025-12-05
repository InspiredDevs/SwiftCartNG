import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SellerHeader from '@/components/seller/SellerHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface EarningItem {
  orderId: string;
  orderCode: string;
  productName: string;
  amount: number;
  date: string;
  status: string;
}

export default function Earnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [paidOut, setPaidOut] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchEarnings();
    }
  }, [user?.id]);

  const fetchEarnings = async () => {
    try {
      // First get seller's products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('name')
        .eq('seller_id', user?.id);

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        setLoading(false);
        return;
      }

      const productNames = products.map(p => p.name);

      // Get order items for seller's products
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_name,
          product_price,
          quantity,
          subtotal
        `)
        .in('product_name', productNames);

      if (orderItemsError) throw orderItemsError;

      if (!orderItems || orderItems.length === 0) {
        setLoading(false);
        return;
      }

      // Get orders for these order items
      const orderIds = [...new Set(orderItems.map(item => item.order_id))];
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_code, status, created_at')
        .in('id', orderIds);

      if (ordersError) throw ordersError;

      // Map orders by ID for quick lookup
      const ordersMap = new Map(orders?.map(o => [o.id, o]) || []);

      // Build earnings list
      const earningsList: EarningItem[] = orderItems.map(item => {
        const order = ordersMap.get(item.order_id);
        return {
          orderId: item.order_id,
          orderCode: order?.order_code || 'N/A',
          productName: item.product_name,
          amount: Number(item.subtotal),
          date: order?.created_at || '',
          status: order?.status || 'Unknown'
        };
      });

      // Calculate totals
      let total = 0;
      let pending = 0;
      let paid = 0;

      earningsList.forEach(item => {
        if (item.status === 'Delivered') {
          total += item.amount;
          // For now, treat all delivered as pending payout (no payout tracking yet)
          pending += item.amount;
        } else if (item.status === 'Paid') {
          total += item.amount;
          paid += item.amount;
        }
      });

      setEarnings(earningsList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      setTotalEarnings(total);
      setPendingEarnings(pending);
      setPaidOut(paid);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'Dispatched':
        return <Badge className="bg-blue-500">Dispatched</Badge>;
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'Paid':
        return <Badge className="bg-emerald-600">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SellerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Earnings</h1>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">From delivered orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(pendingEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting payout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(paidOut)}
              </div>
              <p className="text-xs text-muted-foreground">Successfully paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading earnings...</p>
            ) : earnings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No earnings yet. Start selling to see your earnings here.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.map((item, index) => (
                      <TableRow key={`${item.orderId}-${index}`}>
                        <TableCell className="font-mono text-sm">{item.orderCode}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.productName}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                        <TableCell>
                          {item.date ? format(new Date(item.date), 'MMM d, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}