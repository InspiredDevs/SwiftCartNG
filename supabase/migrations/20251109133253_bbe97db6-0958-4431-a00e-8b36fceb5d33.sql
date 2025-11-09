-- Fix search path security issue
drop function if exists public.update_updated_at_column cascade;

create or replace function public.update_updated_at_column()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recreate triggers
create trigger update_products_updated_at
  before update on public.products
  for each row
  execute function public.update_updated_at_column();

create trigger update_orders_updated_at
  before update on public.orders
  for each row
  execute function public.update_updated_at_column();