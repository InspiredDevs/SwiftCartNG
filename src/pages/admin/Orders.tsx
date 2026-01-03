import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Copy, Check, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Order statuses for the lifecycle
const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  seller_name?: string;
  seller_id?: string;
}

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
  order_items?: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const copyOrderCode = (orderCode: string) => {
    navigator.clipboard.writeText(orderCode);
    setCopiedId(orderCode);
    sonnerToast.success("Order ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    
    // Fetch orders with order items
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Fetch order items for all orders
    const { data: orderItemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*');

    if (itemsError) {
      console.error('Failed to fetch order items:', itemsError);
    }

    // Fetch products to get seller info
    const { data: productsData } = await supabase
      .from('products')
      .select('name, seller_id');

    // Fetch seller stores for seller names
    const { data: sellersData } = await supabase
      .from('seller_stores')
      .select('user_id, store_name');

    // Map seller_id to store_name
    const sellerMap = new Map<string, string>();
    sellersData?.forEach(seller => {
      sellerMap.set(seller.user_id, seller.store_name);
    });

    // Map product name to seller info
    const productSellerMap = new Map<string, { seller_id: string; seller_name: string }>();
    productsData?.forEach(product => {
      if (product.seller_id) {
        productSellerMap.set(product.name, {
          seller_id: product.seller_id,
          seller_name: sellerMap.get(product.seller_id) || 'Unknown Seller'
        });
      }
    });

    // Combine orders with their items and seller info
    const ordersWithItems = ordersData?.map(order => {
      const items = orderItemsData?.filter(item => item.order_id === order.id) || [];
      const itemsWithSellers = items.map(item => {
        const sellerInfo = productSellerMap.get(item.product_name);
        return {
          ...item,
          seller_id: sellerInfo?.seller_id,
          seller_name: sellerInfo?.seller_name || 'SwiftCart NG'
        };
      });
      return {
        ...order,
        order_items: itemsWithSellers
      };
    }) || [];

    setOrders(ordersWithItems);
    setLoading(false);
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(o =>
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer_phone.includes(searchTerm) ||
        o.order_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status.toLowerCase() === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: `Order status updated to ${newStatus}` });
      // Update local state immediately for responsiveness
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
        return 'bg-yellow-500';
      case 'paid':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Get unique sellers from order items
  const getOrderSellers = (items?: OrderItem[]) => {
    if (!items?.length) return [];
    const sellers = new Set<string>();
    items.forEach(item => {
      if (item.seller_name) sellers.add(item.seller_name);
    });
    return Array.from(sellers);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading orders...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and deliveries</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by order ID, customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {ORDER_STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredOrders.map((order) => {
              const sellers = getOrderSellers(order.order_items);
              const isExpanded = expandedOrder === order.id;
              
              return (
                <Collapsible 
                  key={order.id} 
                  open={isExpanded}
                  onOpenChange={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{order.order_code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyOrderCode(order.order_code);
                              }}
                            >
                              {copiedId === order.order_code ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                          </div>
                          <div className="font-semibold w-28 text-right">
                            {formatCurrency(order.total_amount)}
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="border-t p-4 bg-muted/30 space-y-4">
                        {/* Customer Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase">Phone</div>
                            <div className="text-sm font-medium">{order.customer_phone}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase">Email</div>
                            <div className="text-sm font-medium">{order.customer_email || 'N/A'}</div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs text-muted-foreground uppercase">Delivery Address</div>
                            <div className="text-sm font-medium">{order.delivery_address}</div>
                          </div>
                        </div>

                        {/* Sellers Involved */}
                        {sellers.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground uppercase mb-1">Sellers Involved</div>
                            <div className="flex flex-wrap gap-2">
                              {sellers.map(seller => (
                                <Badge key={seller} variant="outline">{seller}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Order Items */}
                        <div>
                          <div className="text-xs text-muted-foreground uppercase mb-2">Products</div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.order_items?.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.product_name}</TableCell>
                                  <TableCell className="text-muted-foreground">{item.seller_name}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.product_price)}</TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                  <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                                </TableRow>
                              ))}
                              {(!order.order_items || order.order_items.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2 py-4">
                                      <Package className="h-4 w-4" />
                                      No product details available
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Status Update */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            Update order status:
                          </div>
                          <Select
                            value={order.status.toLowerCase()}
                            onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>
                                  {getStatusLabel(status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
