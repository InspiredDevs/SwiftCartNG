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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const sendBrevoEmail = async (
  to: { email: string; name?: string }[],
  subject: string,
  htmlContent: string
) => {
  console.log(`Sending email to: ${to.map(t => t.email).join(", ")}`);
  
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: "SwiftCart NG", email: ADMIN_EMAIL },
      to,
      subject,
      htmlContent,
    }),
  });

  const responseText = await response.text();
  console.log(`Brevo API response status: ${response.status}`);

  if (!response.ok) {
    console.error("Brevo API error:", responseText);
    throw new Error(`Failed to send email: ${responseText}`);
  }

  return JSON.parse(responseText);
};

const generateDeadlineWarningEmail = (
  order: any,
  minutesRemaining: number,
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
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Time Running Out!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Hi ${order.customer_name},</p>
          <p style="font-size: 16px; color: #374151;">
            You have approximately <strong style="color: #f59e0b;">${minutesRemaining} minutes</strong> left to make changes to your order details.
          </p>
          
          <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">Order: ${order.order_code}</p>
            <p style="margin: 0 0 10px 0; color: #a16207;">Total: ${formatCurrency(order.total_amount)}</p>
            <p style="margin: 0; color: #a16207; font-size: 14px;">
              After the edit window expires, you won't be able to modify your delivery address or contact details.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${appUrl}/my-orders?orderId=${order.id}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Review Order Now
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px; text-align: center;">
            If everything looks correct, no action is needed!
          </p>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Thank you for shopping with SwiftCart NG!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting deadline warning check...");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    if (!BREVO_API_KEY || !ADMIN_EMAIL) {
      throw new Error("Missing email configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find orders where:
    // - status is pending
    // - deadline_warning_sent is false
    // - order_deadline is within the next 15 minutes
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "Pending")
      .eq("deadline_warning_sent", false)
      .not("order_deadline", "is", null)
      .lte("order_deadline", fifteenMinutesFromNow.toISOString())
      .gt("order_deadline", now.toISOString());

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw ordersError;
    }

    console.log(`Found ${orders?.length || 0} orders nearing deadline`);

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No orders need warning", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appUrl = "https://swiftcartng.lovable.app";
    let processed = 0;
    let errors: string[] = [];

    for (const order of orders) {
      try {
        if (!order.customer_email) {
          console.log(`Order ${order.order_code} has no customer email, skipping`);
          continue;
        }

        // Calculate minutes remaining
        const deadline = new Date(order.order_deadline);
        const minutesRemaining = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (60 * 1000)));

        // Send warning email
        await sendBrevoEmail(
          [{ email: order.customer_email, name: order.customer_name }],
          `⏰ Only ${minutesRemaining} Minutes Left to Edit Order ${order.order_code}`,
          generateDeadlineWarningEmail(order, minutesRemaining, appUrl)
        );

        // Mark as sent
        await supabase
          .from("orders")
          .update({ deadline_warning_sent: true })
          .eq("id", order.id);

        console.log(`Sent deadline warning for order ${order.order_code}`);
        processed++;
      } catch (err) {
        const errorMsg = `Failed to process order ${order.order_code}: ${err}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Deadline warning check complete", 
        processed,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in deadline-warning function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
