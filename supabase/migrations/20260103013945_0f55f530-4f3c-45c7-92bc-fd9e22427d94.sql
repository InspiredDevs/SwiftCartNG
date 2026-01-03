-- Add delivery_address column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS delivery_address text;