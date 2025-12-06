import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SellerHeader from '@/components/seller/SellerHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

interface EarningItem {
  orderId: string;
  orderCode: string;
  productName: string;
  amount: number;
  quantity: number;
  date: string;
  status: string;
}

export default function Earnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalProductsSold, setTotalProductsSold] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchEarnings();
    }
  }, [user?.id]);

  const fetchEarnings = async () => {
    try {
      // Get seller's APPROVED products only
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('name')
        .eq('seller_id', user?.id)
        .eq('status', 'approved');

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        setLoading(false);
        return;
      }

      const productNames = products.map(p => p.name);

      // Get order items for seller's approved products
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
          quantity: item.quantity,
          date: order?.created_at || '',
          status: order?.status || 'Unknown'
        };
      });

      // Calculate totals based on order status
      // Completed statuses: "Delivered", "completed", "paid" (case-insensitive check)
      // Pending statuses: "Pending", "Dispatched", "Processing"
      // Commission: 0% for now (TODO: implement commission logic later)
      const COMMISSION_RATE = 0; // 0% commission - will be handled later
      
      let total = 0;
      let pending = 0;
      let productsSold = 0;

      earningsList.forEach(item => {
        const status = item.status.toLowerCase();
        const earningsAfterCommission = item.amount * (1 - COMMISSION_RATE);
        
        if (status === 'delivered' || status === 'completed' || status === 'paid') {
          // Completed orders count towards total earnings
          total += earningsAfterCommission;
          productsSold += item.quantity;
        } else if (status === 'pending' || status === 'dispatched' || status === 'processing') {
          // Orders in progress count as pending earnings
          pending += earningsAfterCommission;
          productsSold += item.quantity;
        }
        // Cancelled/rejected orders are not counted
      });

      setEarnings(earningsList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      setTotalEarnings(total);
      setPendingEarnings(pending);
      setAvailableBalance(total); // Available balance = total earnings (no withdrawals yet)
      setTotalProductsSold(productsSold);
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
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'delivered':
      case 'completed':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'dispatched':
        return <Badge className="bg-blue-500">Dispatched</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-600">Paid</Badge>;
      case 'processing':
        return <Badge className="bg-orange-500">Processing</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
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
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">From completed orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(pendingEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">Orders in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(availableBalance)}
              </div>
              <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {totalProductsSold}
              </div>
              <p className="text-xs text-muted-foreground">Total units sold</p>
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
                      <TableHead>Qty</TableHead>
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
                        <TableCell>{item.quantity}</TableCell>
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