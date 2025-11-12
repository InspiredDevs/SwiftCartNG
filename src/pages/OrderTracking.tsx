import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function OrderTracking() {
  const [searchType, setSearchType] = useState<'id' | 'phone'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyOrderCode = () => {
    if (order?.order_code) {
      navigator.clipboard.writeText(order.order_code);
      setCopied(true);
      sonnerToast.success("Order ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a search value',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    setOrder(null);

    try {
      let query = supabase.from('orders').select('*');

      if (searchType === 'id') {
        // Try to match by order_code first, fallback to UUID
        query = query.or(`order_code.eq.${searchValue.trim()},id.eq.${searchValue.trim()}`);
      } else {
        query = query.eq('customer_phone', searchValue.trim());
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (error) throw error;

      if (data) {
        setOrder(data);
      } else {
        toast({
          title: 'Not Found',
          description: 'No order found with the provided information',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500';
      case 'Dispatched':
        return 'bg-blue-500';
      case 'Delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Your order is being processed';
      case 'Dispatched':
        return 'Your order is on its way';
      case 'Delivered':
        return 'Your order has been delivered';
      default:
        return 'Order status';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your order ID or phone number to check your order status
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Order</CardTitle>
              <CardDescription>
                Track your order using your order ID or phone number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label>Search By</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={searchType === 'phone' ? 'default' : 'outline'}
                      onClick={() => setSearchType('phone')}
                      className="flex-1"
                    >
                      Phone Number
                    </Button>
                    <Button
                      type="button"
                      variant={searchType === 'id' ? 'default' : 'outline'}
                      onClick={() => setSearchType('id')}
                      className="flex-1"
                    >
                      Order ID
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search">
                    {searchType === 'phone' ? 'Phone Number' : 'Order ID'}
                  </Label>
                  <Input
                    id="search"
                    placeholder={
                      searchType === 'phone'
                        ? 'Enter your phone number'
                        : 'Enter your order ID'
                    }
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {searched && !loading && order && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      Order ID: {order.order_code}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={copyOrderCode}
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{getStatusMessage(order.status)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Date</span>
                    <span className="font-medium">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer Name</span>
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{order.customer_phone}</span>
                  </div>
                  {order.customer_email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{order.customer_email}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Address</span>
                    <span className="font-medium text-right max-w-xs">
                      {order.delivery_address}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground font-semibold">Total Amount</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
}
