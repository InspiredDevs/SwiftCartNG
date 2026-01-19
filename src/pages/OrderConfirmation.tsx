import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Package, ShoppingBag, Copy, Check, Clock, AlertTriangle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderDetails {
  id: string;
  order_code: string;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  created_at: string;
  order_deadline: string | null;
  items: Array<{
    product_name: string;
    quantity: number;
    product_price: number;
  }>;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    customer_name: "",
    customer_phone: "",
    delivery_address: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const copyOrderCode = () => {
    if (order?.order_code) {
      navigator.clipboard.writeText(order.order_code);
      setCopied(true);
      toast.success("Order ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        navigate("/");
        return;
      }

      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError) throw orderError;

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        if (itemsError) throw itemsError;

        const orderWithItems = {
          ...orderData,
          items: itemsData,
        };
        
        setOrder(orderWithItems);
        setEditData({
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          delivery_address: orderData.delivery_address,
        });
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (!order?.order_deadline) return;

    const calculateTimeRemaining = () => {
      const deadline = new Date(order.order_deadline!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(remaining);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [order?.order_deadline]);

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const handleSaveChanges = async () => {
    if (!orderId || isExpired) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: editData.customer_name,
          customer_phone: editData.customer_phone,
          delivery_address: editData.delivery_address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      setOrder(prev => prev ? {
        ...prev,
        customer_name: editData.customer_name,
        customer_phone: editData.customer_phone,
        delivery_address: editData.delivery_address,
      } : null);

      toast.success("Order details updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order details");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <Button onClick={() => navigate("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-muted/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-muted-foreground">
              Thank you for your purchase, {order.customer_name}
            </p>
          </div>

          {/* Countdown Timer */}
          {timeRemaining !== null && (
            <div className={`mb-6 p-4 rounded-lg border ${isExpired ? 'bg-muted border-border' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'}`}>
              <div className="flex items-center gap-3">
                {isExpired ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
                <div className="flex-1">
                  {isExpired ? (
                    <p className="font-medium text-muted-foreground">
                      Edit window has expired
                    </p>
                  ) : (
                    <>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Time remaining to edit order details
                      </p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {formatTimeRemaining(timeRemaining)}
                      </p>
                    </>
                  )}
                </div>
                {!isExpired && !isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Details
                  </Button>
                )}
              </div>
              {!isExpired && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  You can update your name, phone, and delivery address before the timer expires.
                </p>
              )}
            </div>
          )}

          {/* Edit Form */}
          {isEditing && !isExpired && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border space-y-4">
              <h3 className="font-semibold">Edit Order Details</h3>
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editData.customer_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editData.customer_phone}
                  onChange={(e) => setEditData(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Delivery Address</Label>
                <Textarea
                  id="edit-address"
                  value={editData.delivery_address}
                  onChange={(e) => setEditData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    customer_name: order.customer_name,
                    customer_phone: order.customer_phone,
                    delivery_address: order.delivery_address,
                  });
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="border-t border-b border-border py-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-medium">{order.order_code}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={copyOrderCode}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="text-sm font-medium">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="text-sm font-medium whitespace-pre-wrap">{order.delivery_address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                ₦{order.total_amount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Order Summary</h2>
            </div>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-muted/50 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ₦{(item.product_price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/shop")}
              className="flex-1"
              size="lg"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Continue Shopping
            </Button>
            <Button
              onClick={() => navigate(`/my-orders?orderId=${orderId}`)}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Track Order
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            You can view and track your order status anytime from your{" "}
            <span
              onClick={() => navigate("/my-orders")}
              className="text-primary hover:underline cursor-pointer"
            >
              My Orders
            </span>{" "}
            page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
