-- Create seller support tickets table
CREATE TABLE public.seller_support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  seller_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_support_tickets ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own tickets
CREATE POLICY "Sellers can view their own tickets"
ON public.seller_support_tickets
FOR SELECT
USING (auth.uid() = seller_id);

-- Sellers can create tickets
CREATE POLICY "Sellers can create tickets"
ON public.seller_support_tickets
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.seller_support_tickets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update tickets (for replies)
CREATE POLICY "Admins can update tickets"
ON public.seller_support_tickets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_seller_support_tickets_updated_at
BEFORE UPDATE ON public.seller_support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();