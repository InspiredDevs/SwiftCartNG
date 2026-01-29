-- Create saved_items table for "Save for Later" feature
CREATE TABLE public.saved_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved items"
  ON public.saved_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved items"
  ON public.saved_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved items"
  ON public.saved_items FOR DELETE
  USING (auth.uid() = user_id);

-- Add cancelled status support and notification tracking to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deadline_warning_sent BOOLEAN DEFAULT false;