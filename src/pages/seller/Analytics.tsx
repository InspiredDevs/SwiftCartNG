import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SellerHeader from '@/components/seller/SellerHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, ShoppingBag, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderData {
  order_id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
  created_at: string;
  status: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analytics() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    if (!authLoading && (!user || !isSeller)) {
      navigate('/auth/login');
    }
  }, [user, isSeller, authLoading, navigate]);

  useEffect(() => {
    if (user && isSeller) {
      fetchAnalyticsData();
    }
  }, [user, isSeller, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Get seller's products
      const { data: products } = await supabase
        .from('products')
        .select('name')
        .eq('seller_id', user?.id);

      if (!products || products.length === 0) {
        setOrderData([]);
        setLoading(false);
        return;
      }

      const productNames = products.map(p => p.name);

      // Get orders containing seller's products
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          order_items (
            product_name,
            quantity,
            subtotal
          )
        `)
        .gte('created_at', startDate.toISOString());

      if (!orders) {
        setOrderData([]);
        setLoading(false);
        return;
      }

      // Filter to only include seller's products
      const sellerOrders: OrderData[] = [];
      orders.forEach(order => {
        order.order_items?.forEach((item: any) => {
          if (productNames.includes(item.product_name)) {
            sellerOrders.push({
              order_id: order.id,
              product_name: item.product_name,
              quantity: item.quantity,
              subtotal: item.subtotal,
              created_at: order.created_at || '',
              status: order.status || 'pending'
            });
          }
        });
      });

      setOrderData(sellerOrders);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalRevenue = orderData
    .filter(o => ['paid', 'delivered', 'shipped'].includes(o.status?.toLowerCase()))
    .reduce((sum, o) => sum + o.subtotal, 0);

  const totalOrders = new Set(orderData.map(o => o.order_id)).size;
  const totalProductsSold = orderData.reduce((sum, o) => sum + o.quantity, 0);

  // Revenue by day
  const revenueByDay = orderData.reduce((acc: any, order) => {
    const date = new Date(order.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = 0;
    if (['paid', 'delivered', 'shipped'].includes(order.status?.toLowerCase())) {
      acc[date] += order.subtotal;
    }
    return acc;
  }, {});

  const revenueChartData = Object.entries(revenueByDay).map(([date, revenue]) => ({
    date,
    revenue
  })).slice(-14);

  // Top products
  const productSales = orderData.reduce((acc: any, order) => {
    if (!acc[order.product_name]) acc[order.product_name] = { name: order.product_name, sales: 0, revenue: 0 };
    acc[order.product_name].sales += order.quantity;
    acc[order.product_name].revenue += order.subtotal;
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5) as any[];

  // Order status distribution
  const statusCounts = orderData.reduce((acc: any, order) => {
    const status = order.status?.toLowerCase() || 'pending';
    if (!acc[status]) acc[status] = 0;
    acc[status]++;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SellerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold">Sales Analytics</h1>
              <p className="text-muted-foreground">Track your store performance</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
              { title: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'text-blue-600' },
              { title: 'Products Sold', value: totalProductsSold, icon: Package, color: 'text-purple-600' },
              { title: 'Avg Order Value', value: `₦${totalOrders ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}`, icon: TrendingUp, color: 'text-orange-600' },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `₦${v / 1000}k`} />
                        <Tooltip 
                          formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No revenue data for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Status Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No orders for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => `₦${v / 1000}k`} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No product sales data for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
