-- Allow one review per product per order (but not globally per product)
-- The existing UNIQUE(user_id, product_id) blocks reviewing the same product on a later order.
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS unique_user_product_review;