-- Update app_role enum to include customer and seller
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'seller';

-- Create seller_stores table for seller information
CREATE TABLE IF NOT EXISTS public.seller_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  store_name text NOT NULL,
  store_description text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on seller_stores
ALTER TABLE public.seller_stores ENABLE ROW LEVEL SECURITY;

-- RLS policies for seller_stores
CREATE POLICY "Sellers can view their own store"
  ON public.seller_stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sellers can update their own store"
  ON public.seller_stores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all stores"
  ON public.seller_stores FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all stores"
  ON public.seller_stores FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert seller store"
  ON public.seller_stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update products table to include seller information
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_official_store boolean DEFAULT true;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, user_id, order_id)
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Update handle_new_user function to NOT assign any role by default
-- Users will get their role assigned during signup based on their choice
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Assign role based on user_metadata
  IF new.raw_user_meta_data->>'role' = 'seller' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'seller');
  ELSIF new.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin');
  ELSE
    -- Default to customer role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'customer');
  END IF;
  
  RETURN new;
END;
$$;

-- Create trigger for seller_stores updated_at
CREATE TRIGGER update_seller_stores_updated_at
  BEFORE UPDATE ON public.seller_stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();