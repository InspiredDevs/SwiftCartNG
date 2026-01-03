import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package, ChevronRight, Copy, Check, Clock, Truck, CheckCircle, XCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_code: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_address: string;
  order_items: OrderItem[];
}

const MyOrders = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(searchParams.get('orderId'));
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_code,
            status,
            total_amount,
            created_at,
            delivery_address,
            order_items (
              id,
              product_name,
              product_price,
              quantity,
              subtotal
            )
          `)
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const copyOrderCode = async (orderCode: string) => {
    try {
      await navigator.clipboard.writeText(orderCode);
      setCopiedOrderId(orderCode);
      toast.success('Order ID copied!');
      setTimeout(() => setCopiedOrderId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    switch (normalizedStatus) {
      case 'pending':
        return { 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', 
          icon: Clock,
          label: 'Pending',
          step: 1
        };
      case 'paid':
        return { 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 
          icon: CreditCard,
          label: 'Paid',
          step: 2
        };
      case 'shipped':
        return { 
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', 
          icon: Truck,
          label: 'Shipped',
          step: 3
        };
      case 'delivered':
        return { 
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 
          icon: CheckCircle,
          label: 'Delivered',
          step: 4
        };
      case 'cancelled':
        return { 
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', 
          icon: XCircle,
          label: 'Cancelled',
          step: 0
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground', 
          icon: Clock,
          label: status,
          step: 0
        };
    }
  };

  const OrderStatusProgress = ({ status }: { status: string }) => {
    const config = getStatusConfig(status);
    const steps = [
      { label: 'Pending', step: 1 },
      { label: 'Paid', step: 2 },
      { label: 'Shipped', step: 3 },
      { label: 'Delivered', step: 4 },
    ];

    if (config.step === 0) {
      return (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">Order Cancelled</span>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, index) => (
            <div key={s.label} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                ${config.step >= s.step 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }`}
              >
                {config.step >= s.step ? '✓' : index + 1}
              </div>
              <span className={`text-xs mt-1 text-center ${config.step >= s.step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center">
          {steps.map((s, index) => (
            <div key={s.label} className="flex-1">
              {index < steps.length - 1 && (
                <div className={`h-1 mx-4 rounded ${config.step > s.step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button asChild>
                <Link to="/shop">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedOrder === order.id;

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{order.order_code}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyOrderCode(order.order_code);
                            }}
                          >
                            {copiedOrderId === order.order_code ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                      <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t border-border pt-6">
                    {/* Status Progress */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-4">Order Status</h4>
                      <OrderStatusProgress status={order.status} />
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Items</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                            <div>
                              <span className="font-medium">{item.product_name}</span>
                              <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Delivery Address</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{order.delivery_address}</p>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
