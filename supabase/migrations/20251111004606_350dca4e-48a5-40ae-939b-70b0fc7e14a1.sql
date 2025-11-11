-- Add order_code column to orders table
ALTER TABLE public.orders ADD COLUMN order_code text;

-- Create a unique index on order_code
CREATE UNIQUE INDEX orders_order_code_key ON public.orders(order_code);

-- Create function to generate short order codes
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'SCN-';
  i integer;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Update existing orders with generated order codes
DO $$
DECLARE
  ord record;
  new_code text;
  code_exists boolean;
BEGIN
  FOR ord IN SELECT id FROM public.orders WHERE order_code IS NULL LOOP
    LOOP
      new_code := public.generate_order_code();
      SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE public.orders SET order_code = new_code WHERE id = ord.id;
  END LOOP;
END;
$$;

-- Make order_code NOT NULL after populating existing records
ALTER TABLE public.orders ALTER COLUMN order_code SET NOT NULL;