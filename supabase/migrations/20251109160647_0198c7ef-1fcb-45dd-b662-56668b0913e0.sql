-- Create function to decrement product stock
CREATE OR REPLACE FUNCTION public.decrement_stock(
  product_id uuid,
  quantity_to_subtract integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET 
    stock_quantity = GREATEST(0, stock_quantity - quantity_to_subtract),
    in_stock = CASE 
      WHEN (stock_quantity - quantity_to_subtract) <= 0 THEN false 
      ELSE true 
    END,
    updated_at = now()
  WHERE id = product_id;
END;
$$;