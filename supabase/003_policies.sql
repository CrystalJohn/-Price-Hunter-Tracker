-- RLS policies for favorites table
-- Run this after creating tables in your Supabase project

-- enable RLS on favorites
alter table if exists public.favorites enable row level security;

-- allow owners to select their favorites
create policy if not exists "favorites_select_owner" on public.favorites
  for select
  using (auth.uid() = user_id);

-- allow authenticated users to insert favorites where user_id = auth.uid()
create policy if not exists "favorites_insert_owner" on public.favorites
  for insert
  with check (auth.uid() = user_id);

-- allow owners to delete their favorites
create policy if not exists "favorites_delete_owner" on public.favorites
  for delete
  using (auth.uid() = user_id);

-- Note: ensure anon key is for public-select where you want to allow anonymous reads
-- If you need clients to read products/product_prices without auth, keep previous GRANT SELECT to anon.
