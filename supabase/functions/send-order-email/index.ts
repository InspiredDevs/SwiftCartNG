import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface SellerOrderItem extends OrderItem {
  seller_id?: string;
}

interface EmailRequest {
  type: "order_placed" | "status_update";
  orderId: string;
  newStatus?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusDescription = (status: string): string => {
  const descriptions: Record<string, string> = {
    pending: "Your order has been received and is awaiting processing.",
    paid: "Payment confirmed! Your order is being prepared.",
    shipped: "Great news! Your order is on its way to you.",
    delivered: "Your order has been delivered. Thank you for shopping with us!",
    cancelled: "Your order has been cancelled. Contact support if you have questions.",
  };
  return descriptions[status.toLowerCase()] || `Your order status is now: ${status}`;
};

const sendBrevoEmail = async (
  to: { email: string; name?: string }[],
  subject: string,
  htmlContent: string
) => {
  console.log(`Sending email to: ${to.map(t => t.email).join(", ")}`);
  console.log(`Using BREVO_API_KEY: ${BREVO_API_KEY ? "Key present (length: " + BREVO_API_KEY.length + ")" : "Key missing"}`);
  console.log(`Using ADMIN_EMAIL as sender: ${ADMIN_EMAIL}`);
  
  const requestBody = {
    sender: { name: "SwiftCart NG", email: ADMIN_EMAIL },
    to,
    subject,
    htmlContent,
  };
  
  console.log("Request body (excluding htmlContent):", JSON.stringify({ ...requestBody, htmlContent: "[HTML content omitted]" }));
  
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY!,
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log(`Brevo API response status: ${response.status}`);
  console.log(`Brevo API response: ${responseText}`);

  if (!response.ok) {
    console.error("Brevo API error:", responseText);
    throw new Error(`Failed to send email: ${responseText}`);
  }

  const result = JSON.parse(responseText);
  console.log("Email sent successfully:", result);
  return result;
};

const generateOrderItemsHtml = (items: OrderItem[]) => {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `
    )
    .join("");
};

const generateAdminOrderEmail = (
  order: any,
  items: OrderItem[],
  appUrl: string
) => {
  const orderDate = new Date(order.created_at).toLocaleString("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🛒 New Order Received!</h1>
        </div>
        <div style="padding: 30px;">
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> ${order.order_code}</p>
            <p style="margin: 0 0 10px 0;"><strong>Customer:</strong> ${order.customer_name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Total:</strong> ${formatCurrency(order.total_amount)}</p>
            <p style="margin: 0;"><strong>Date:</strong> ${orderDate}</p>
          </div>
          <a href="${appUrl}/admin/orders" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View in Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateCustomerOrderEmail = (
  order: any,
  items: OrderItem[],
  appUrl: string
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✅ Order Confirmed!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Hi ${order.customer_name},</p>
          <p style="font-size: 16px; color: #374151;">Thank you for your order! We've received it and will process it shortly.</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 5px 0; font-weight: 600;">Order ID: ${order.order_code}</p>
            <p style="margin: 0; color: #6b7280;">Status: <span style="color: #f59e0b; font-weight: 500;">Pending</span></p>
          </div>

          <h3 style="margin: 25px 0 15px 0; color: #111827;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${generateOrderItemsHtml(items)}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 12px; font-weight: 700; border-top: 2px solid #e5e7eb;">Total</td>
                <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #10b981; border-top: 2px solid #e5e7eb;">${formatCurrency(order.total_amount)}</td>
              </tr>
            </tfoot>
          </table>

          <h3 style="margin: 25px 0 10px 0; color: #111827;">Delivery Address</h3>
          <p style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 0; color: #374151;">${order.delivery_address}</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${appUrl}/my-orders?orderId=${order.id}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Order</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Thank you for shopping with SwiftCart NG!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateStatusUpdateEmail = (
  order: any,
  newStatus: string,
  appUrl: string,
  orderItems?: OrderItem[]
) => {
  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    paid: "#3b82f6",
    shipped: "#8b5cf6",
    delivered: "#10b981",
    cancelled: "#ef4444",
  };
  
  const statusColor = statusColors[newStatus.toLowerCase()] || "#6b7280";
  const isDelivered = newStatus.toLowerCase() === 'delivered';

  // Generate review CTA section for delivered orders
  const reviewSection = isDelivered && orderItems && orderItems.length > 0 ? `
    <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">⭐ How was your purchase?</h3>
      <p style="margin: 0 0 15px 0; color: #a16207; font-size: 14px;">
        Your feedback helps other shoppers and our sellers improve!
      </p>
      <a href="${appUrl}/my-reviews?order=${order.id}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Review Your Product(s)
      </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${isDelivered ? '🎉 Order Delivered!' : '📦 Order Update'}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Hi ${order.customer_name},</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #6b7280;">Order ID: <strong>${order.order_code}</strong></p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${statusColor};">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
          </div>

          <p style="font-size: 16px; color: #374151; line-height: 1.6;">${getStatusDescription(newStatus)}</p>

          ${reviewSection}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${appUrl}/my-orders?orderId=${order.id}" style="display: inline-block; background: ${statusColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Order</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Thank you for shopping with SwiftCart NG!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ============ SELLER EMAIL TEMPLATES ============

const generateSellerNewOrderEmail = (
  order: any,
  sellerItems: OrderItem[],
  sellerName: string,
  sellerTotal: number,
  appUrl: string
) => {
  const orderDate = new Date(order.created_at).toLocaleString("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New Order for Your Products!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Hi ${sellerName},</p>
          <p style="font-size: 16px; color: #374151;">Great news! A customer has ordered your products.</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> ${order.order_code}</p>
            <p style="margin: 0 0 10px 0;"><strong>Your Earnings:</strong> ${formatCurrency(sellerTotal)}</p>
            <p style="margin: 0 0 10px 0;"><strong>Order Status:</strong> Pending</p>
            <p style="margin: 0;"><strong>Date:</strong> ${orderDate}</p>
          </div>

          <h3 style="margin: 25px 0 15px 0; color: #111827;">Your Products in This Order</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left;">Product</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${generateOrderItemsHtml(sellerItems)}
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${appUrl}/seller/orders" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View in Seller Dashboard</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">SwiftCart NG - Seller Portal</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateSellerStatusUpdateEmail = (
  order: any,
  sellerItems: OrderItem[],
  sellerName: string,
  newStatus: string,
  appUrl: string
) => {
  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    paid: "#3b82f6",
    shipped: "#8b5cf6",
    delivered: "#10b981",
    cancelled: "#ef4444",
  };
  
  const statusColor = statusColors[newStatus.toLowerCase()] || "#6b7280";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📦 Order Status Updated</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Hi ${sellerName},</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #6b7280;">Order ID: <strong>${order.order_code}</strong></p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${statusColor};">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
          </div>

          <h3 style="margin: 25px 0 15px 0; color: #111827;">Your Products in This Order</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left;">Product</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${generateOrderItemsHtml(sellerItems)}
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${appUrl}/seller/orders" style="display: inline-block; background: ${statusColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View in Seller Dashboard</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">SwiftCart NG - Seller Portal</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ============ SELLER NOTIFICATION LOGIC ============

interface SellerInfo {
  seller_id: string;
  seller_email: string;
  seller_name: string;
  items: OrderItem[];
  total: number;
}

const getSellerInfoFromOrderItems = async (
  supabase: any,
  orderItems: any[]
): Promise<Map<string, SellerInfo>> => {
  // Get all product names from order items
  const productNames = orderItems.map(item => item.product_name);
  
  // Fetch products with their seller_id
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('name, seller_id')
    .in('name', productNames);

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return new Map();
  }

  // Get unique seller IDs (excluding null - official store products)
  const sellerIds = [...new Set(products?.filter((p: any) => p.seller_id).map((p: any) => p.seller_id))] as string[];
  
  if (sellerIds.length === 0) {
    console.log('No third-party sellers found for this order');
    return new Map();
  }

  // Fetch seller profiles (emails)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', sellerIds);

  if (profilesError) {
    console.error('Error fetching seller profiles:', profilesError);
    return new Map();
  }

  // Fetch seller stores (for store names)
  const { data: stores, error: storesError } = await supabase
    .from('seller_stores')
    .select('user_id, store_name')
    .in('user_id', sellerIds);

  if (storesError) {
    console.error('Error fetching seller stores:', storesError);
  }

  // Create a map of seller_id to seller info
  const sellerMap = new Map<string, SellerInfo>();

  // Build product -> seller_id map
  const productSellerMap = new Map<string, string>();
  products?.forEach((p: any) => {
    if (p.seller_id) {
      productSellerMap.set(p.name, p.seller_id);
    }
  });

  // Build seller_id -> email/name map
  const sellerProfileMap = new Map<string, { email: string; name: string }>();
  profiles?.forEach((p: any) => {
    const store = stores?.find((s: any) => s.user_id === p.id);
    sellerProfileMap.set(p.id, {
      email: p.email,
      name: store?.store_name || p.full_name || 'Seller'
    });
  });

  // Group order items by seller
  orderItems.forEach(item => {
    const sellerId = productSellerMap.get(item.product_name);
    if (!sellerId) return; // Skip official store products

    const profile = sellerProfileMap.get(sellerId);
    if (!profile || !profile.email) {
      console.log(`No email found for seller ${sellerId}`);
      return;
    }

    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, {
        seller_id: sellerId,
        seller_email: profile.email,
        seller_name: profile.name,
        items: [],
        total: 0
      });
    }

    const seller = sellerMap.get(sellerId)!;
    seller.items.push({
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: item.quantity,
      subtotal: item.subtotal
    });
    seller.total += item.subtotal;
  });

  console.log(`Found ${sellerMap.size} seller(s) to notify`);
  return sellerMap;
};

const sendSellerNotifications = async (
  supabase: any,
  order: any,
  orderItems: any[],
  appUrl: string,
  type: 'order_placed' | 'status_update',
  newStatus?: string
) => {
  const sellerMap = await getSellerInfoFromOrderItems(supabase, orderItems);

  for (const [sellerId, sellerInfo] of sellerMap) {
    try {
      console.log(`Sending ${type} email to seller: ${sellerInfo.seller_email}`);
      
      let htmlContent: string;
      let subject: string;

      if (type === 'order_placed') {
        htmlContent = generateSellerNewOrderEmail(
          order,
          sellerInfo.items,
          sellerInfo.seller_name,
          sellerInfo.total,
          appUrl
        );
        subject = `🎉 New Order ${order.order_code} - ${formatCurrency(sellerInfo.total)}`;
      } else {
        htmlContent = generateSellerStatusUpdateEmail(
          order,
          sellerInfo.items,
          sellerInfo.seller_name,
          newStatus!,
          appUrl
        );
        subject = `Order ${order.order_code} - Status: ${newStatus?.charAt(0).toUpperCase()}${newStatus?.slice(1)}`;
      }

      await sendBrevoEmail(
        [{ email: sellerInfo.seller_email, name: sellerInfo.seller_name }],
        subject,
        htmlContent
      );
    } catch (error) {
      console.error(`Failed to send email to seller ${sellerId}:`, error);
      // Continue with other sellers even if one fails
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, orderId, newStatus }: EmailRequest = await req.json();
    
    console.log(`Processing ${type} email for order: ${orderId}`);

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    if (!ADMIN_EMAIL) {
      throw new Error("ADMIN_EMAIL is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to fetch order: ${orderError?.message || "Order not found"}`);
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Failed to fetch order items:", itemsError);
    }

    const orderItems: OrderItem[] = items || [];
    
    // Get the app URL from the request origin or use a default
    const origin = req.headers.get("origin") || "https://swiftcart.ng";
    const appUrl = origin;

    if (type === "order_placed") {
      // Send admin notification
      const adminHtml = generateAdminOrderEmail(order, orderItems, appUrl);
      await sendBrevoEmail(
        [{ email: ADMIN_EMAIL, name: "Admin" }],
        `🛒 New Order ${order.order_code} - ${formatCurrency(order.total_amount)}`,
        adminHtml
      );

      // Send customer confirmation
      if (order.customer_email) {
        const customerHtml = generateCustomerOrderEmail(order, orderItems, appUrl);
        await sendBrevoEmail(
          [{ email: order.customer_email, name: order.customer_name }],
          `Order Confirmed! - ${order.order_code}`,
          customerHtml
        );
      }

      // Send seller notifications
      await sendSellerNotifications(supabase, order, orderItems, appUrl, 'order_placed');

    } else if (type === "status_update" && newStatus) {
      // Send status update to customer
      if (order.customer_email) {
        const statusHtml = generateStatusUpdateEmail(order, newStatus, appUrl, orderItems);
        await sendBrevoEmail(
          [{ email: order.customer_email, name: order.customer_name }],
          `Order ${order.order_code} - Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          statusHtml
        );
      }

      // Send seller notifications for status updates
      await sendSellerNotifications(supabase, order, orderItems, appUrl, 'status_update', newStatus);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email(s) sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
