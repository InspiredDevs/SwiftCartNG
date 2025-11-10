-- Allow anyone to view orders by order ID or phone number (for order tracking)
CREATE POLICY "Anyone can view their orders by ID or phone" 
ON public.orders 
FOR SELECT 
USING (true);

-- Allow anyone to view order items for order tracking
CREATE POLICY "Anyone can view order items" 
ON public.order_items 
FOR SELECT 
USING (true);