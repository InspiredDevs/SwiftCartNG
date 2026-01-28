-- Fix user_purchased_product function to handle case-insensitive status check
CREATE OR REPLACE FUNCTION public.user_purchased_product(p_user_id uuid, p_product_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN public.products p ON oi.product_name = p.name
    WHERE o.customer_email = (SELECT email FROM auth.users WHERE id = p_user_id)
      AND p.id = p_product_id
      AND LOWER(o.status) = 'delivered'
  );
$function$;