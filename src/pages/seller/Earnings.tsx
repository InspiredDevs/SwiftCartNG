import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SellerHeader from '@/components/seller/SellerHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Clock, CheckCircle, Package, CalendarIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface EarningItem {
  orderId: string;
  orderCode: string;
  productName: string;
  amount: number;
  quantity: number;
  date: string;
  status: string;
}

type DatePreset = 'all' | 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export default function Earnings() {
  const { user } = useAuth();
  const [allEarnings, setAllEarnings] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (user?.id) {
      fetchEarnings();
    }
  }, [user?.id]);

  // Calculate date range based on preset
  const getDateRangeFromPreset = (preset: DatePreset): { from: Date; to: Date } | null => {
    const today = new Date();
    switch (preset) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'last7days':
        return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
      case 'last30days':
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
      case 'thisMonth':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'thisYear':
        return { from: startOfYear(today), to: endOfDay(today) };
      case 'custom':
        if (dateRange?.from && dateRange?.to) {
          return { from: startOfDay(dateRange.from), to: endOfDay(dateRange.to) };
        }
        return null;
      default:
        return null;
    }
  };

  // Filter earnings based on date range
  const filteredEarnings = useMemo(() => {
    const range = getDateRangeFromPreset(datePreset);
    if (!range) return allEarnings;

    return allEarnings.filter(item => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      return isWithinInterval(itemDate, { start: range.from, end: range.to });
    });
  }, [allEarnings, datePreset, dateRange]);

  // Calculate totals from filtered earnings
  const { totalEarnings, pendingEarnings, availableBalance, totalProductsSold } = useMemo(() => {
    const COMMISSION_RATE = 0; // 0% commission - will be handled later
    let total = 0;
    let pending = 0;
    let productsSold = 0;

    filteredEarnings.forEach(item => {
      const status = item.status.toLowerCase();
      const earningsAfterCommission = item.amount * (1 - COMMISSION_RATE);
      
      // Completed orders: delivered or paid
      if (status === 'delivered' || status === 'paid') {
        total += earningsAfterCommission;
        productsSold += item.quantity;
      } 
      // Pending orders: pending or shipped (in transit)
      else if (status === 'pending' || status === 'shipped') {
        pending += earningsAfterCommission;
        productsSold += item.quantity;
      }
      // Cancelled orders are excluded from earnings
    });

    return {
      totalEarnings: total,
      pendingEarnings: pending,
      availableBalance: total,
      totalProductsSold: productsSold
    };
  }, [filteredEarnings]);

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

      setAllEarnings(earningsList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (value: DatePreset) => {
    setDatePreset(value);
    if (value !== 'custom') {
      setDateRange(undefined);
    }
  };

  const getDateRangeLabel = () => {
    const range = getDateRangeFromPreset(datePreset);
    if (!range) return 'All Time';
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
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
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-500">Shipped</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-blue-500">Paid</Badge>;
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Earnings</h1>
          
          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={datePreset} onValueChange={(value) => handlePresetChange(value as DatePreset)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {datePreset !== 'all' && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing earnings for: {getDateRangeLabel()}
          </p>
        )}

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
            ) : filteredEarnings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {allEarnings.length === 0 
                  ? "No earnings yet. Start selling to see your earnings here."
                  : "No earnings found for the selected date range."}
              </p>
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
                    {filteredEarnings.map((item, index) => (
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