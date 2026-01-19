-- Add order_deadline column to orders table for address confirmation countdown
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_deadline timestamp with time zone;

-- Create function to set default deadline (2 hours from creation) for new orders
CREATE OR REPLACE FUNCTION public.set_order_deadline()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_deadline IS NULL THEN
    NEW.order_deadline := NEW.created_at + interval '2 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS set_order_deadline_trigger ON public.orders;
CREATE TRIGGER set_order_deadline_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_deadline();

-- Update existing orders to have a deadline (set to 2 hours from created_at)
UPDATE public.orders 
SET order_deadline = created_at + interval '2 hours'
WHERE order_deadline IS NULL;