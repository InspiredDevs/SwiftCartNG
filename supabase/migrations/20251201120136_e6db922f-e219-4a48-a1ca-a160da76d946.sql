-- Add status field to products table for approval workflow
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing products to be approved by default
UPDATE public.products SET status = 'approved' WHERE status IS NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Update RLS policy for products to only show approved products to public
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view approved products"
ON public.products
FOR SELECT
USING (status = 'approved' OR has_role(auth.uid(), 'admin'));

-- Sellers can view their own products regardless of status
CREATE POLICY "Sellers can view their own products"
ON public.products
FOR SELECT
USING (seller_id = auth.uid());

-- Sellers can only insert products with pending status
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Sellers can insert pending products"
ON public.products
FOR INSERT
WITH CHECK (
  seller_id = auth.uid() 
  AND has_role(auth.uid(), 'seller')
  AND status = 'pending'
);

-- Admins can insert products with any status
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products"
ON public.products
FOR UPDATE
USING (seller_id = auth.uid() AND has_role(auth.uid(), 'seller'));

-- Ensure reviews table has proper constraints (use DO block for conditional constraint)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_product_review'
  ) THEN
    ALTER TABLE public.reviews 
    ADD CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id);
  END IF;
END $$;

-- Create function to check if user purchased a product
CREATE OR REPLACE FUNCTION public.user_purchased_product(p_user_id uuid, p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN public.products p ON oi.product_name = p.name
    WHERE o.customer_email = (SELECT email FROM auth.users WHERE id = p_user_id)
      AND p.id = p_product_id
      AND o.status = 'Delivered'
  );
$$;

-- Update reviews RLS policies
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews for purchased products"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.user_purchased_product(auth.uid(), product_id)
);

-- Update products table to recalculate average rating via trigger
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.products
    SET rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE product_id = OLD.product_id
    )
    WHERE id = OLD.product_id;
    RETURN OLD;
  ELSE
    UPDATE public.products
    SET rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE product_id = NEW.product_id
    )
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_rating_on_review ON public.reviews;
CREATE TRIGGER update_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating();