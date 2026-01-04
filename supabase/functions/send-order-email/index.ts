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
          <h1 style="color: white; margin: 0; font-size: 24px;">📦 Order Update</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Hi ${order.customer_name},</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #6b7280;">Order ID: <strong>${order.order_code}</strong></p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${statusColor};">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
          </div>

          <p style="font-size: 16px; color: #374151; line-height: 1.6;">${getStatusDescription(newStatus)}</p>

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
    } else if (type === "status_update" && newStatus) {
      // Send status update to customer
      if (order.customer_email) {
        const statusHtml = generateStatusUpdateEmail(order, newStatus, appUrl);
        await sendBrevoEmail(
          [{ email: order.customer_email, name: order.customer_name }],
          `Order ${order.order_code} - Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          statusHtml
        );
      }
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
