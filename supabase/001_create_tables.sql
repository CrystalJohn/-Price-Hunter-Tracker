-- Migration: create basic tables required by the app
-- Run this in your Supabase project's SQL editor (https://app.supabase.com)

-- enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  image_url text,
  created_at timestamptz default now()
);

-- stores
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text
);

-- product_prices
create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  price numeric not null,
  updated_at timestamptz default now()
);

create index if not exists idx_product_prices_product_id on public.product_prices(product_id);

-- price_history
create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  price numeric not null,
  recorded_at timestamptz default now()
);

create index if not exists idx_price_history_product_id on public.price_history(product_id);

-- favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now()
);

-- grant read-only access to anon (so the client can SELECT via anon key)
grant select on public.products, public.product_prices, public.price_history, public.stores, public.favorites to anon;

-- allow usage on sequences to anon (if any sequences created)
grant usage on schema public to anon;

-- Notes:
-- - If you use Row Level Security (RLS), create policies to allow authenticated users to insert/delete favorites.
-- - This migration keeps things permissive for quick local/dev testing (SELECT granted to anon).
