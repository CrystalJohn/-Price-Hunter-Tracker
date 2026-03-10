-- Full seed for development/testing
-- Run after 001_create_tables.sql

-- For UPSERT to work and always Return IDs, we generate deterministic UUIDs based on names using md5() 
-- This ensures running the script multiple times updates existing records without duplicating them or failing to return IDs.

with
  inserted_stores as (
    insert into public.stores (id, name, logo_url)
    values
      (md5('SportMart')::uuid, 'SportMart', 'https://example.com/logos/sportmart.png'),
      (md5('RunnerHub')::uuid, 'RunnerHub', 'https://example.com/logos/runnerhub.png'),
      (md5('FastShoes')::uuid, 'FastShoes', 'https://example.com/logos/fastshoes.png'),
      (md5('OutdoorPro')::uuid, 'OutdoorPro', 'https://example.com/logos/outdoorpro.png')
    on conflict (id) do update 
      set name = EXCLUDED.name, logo_url = EXCLUDED.logo_url
    returning id, name
  ),

  inserted_products as (
    insert into public.products (id, name, brand, image_url, created_at)
    values
      -- Nike
      (md5('Nike Swoosh Headband')::uuid, 'Nike Swoosh Headband', 'Nike', 'https://placehold.co/600x400/111827/ffffff.png?text=Nike+Headband', now()),
      (md5('Nike Brasilia Duffel')::uuid, 'Nike Brasilia Duffel Bag', 'Nike', 'https://placehold.co/600x400/111827/ffffff.png?text=Nike+Duffel', now()),
      (md5('Nike HyperCharge Bottle')::uuid, 'Nike HyperCharge Water Bottle', 'Nike', 'https://placehold.co/600x400/111827/ffffff.png?text=Nike+Bottle', now()),
      (md5('Nike Lightweight Gloves')::uuid, 'Nike Lightweight Running Gloves', 'Nike', 'https://placehold.co/600x400/111827/ffffff.png?text=Nike+Gloves', now()),
      (md5('Nike Fundamental Mat')::uuid, 'Nike Fundamental Yoga Mat', 'Nike', 'https://placehold.co/600x400/111827/ffffff.png?text=Nike+Yoga+Mat', now()),
      -- Adidas
      (md5('Adidas Tiro Duffel')::uuid, 'Adidas Tiro Duffel Bag', 'Adidas', 'https://placehold.co/600x400/111827/ffffff.png?text=Adidas+Duffel', now()),
      (md5('Adidas Steel Bottle')::uuid, 'Adidas Steel Metal Bottle', 'Adidas', 'https://placehold.co/600x400/111827/ffffff.png?text=Adidas+Bottle', now()),
      (md5('Adidas Superlite Cap')::uuid, 'Adidas Superlite Hat', 'Adidas', 'https://placehold.co/600x400/111827/ffffff.png?text=Adidas+Cap', now()),
      (md5('Adidas Training Gloves')::uuid, 'Adidas Essential Gloves', 'Adidas', 'https://placehold.co/600x400/111827/ffffff.png?text=Adidas+Gloves', now()),
      (md5('Adidas Cushioned Socks')::uuid, 'Adidas Cushioned Crew Socks', 'Adidas', 'https://placehold.co/600x400/111827/ffffff.png?text=Adidas+Socks', now()),
      -- Puma
      (md5('Puma Challenger Duffel')::uuid, 'Puma Challenger Duffel', 'Puma', 'https://placehold.co/600x400/111827/ffffff.png?text=Puma+Duffel', now()),
      (md5('Puma TR Bottle')::uuid, 'Puma Training Water Bottle', 'Puma', 'https://placehold.co/600x400/111827/ffffff.png?text=Puma+Bottle', now()),
      (md5('Puma Running Cap')::uuid, 'Puma Lightweight Running Cap', 'Puma', 'https://placehold.co/600x400/111827/ffffff.png?text=Puma+Cap', now()),
      (md5('Puma Gym Sack')::uuid, 'Puma Phase Gym Sack', 'Puma', 'https://placehold.co/600x400/111827/ffffff.png?text=Puma+Gym+Sack', now()),
      (md5('Puma Sweatband Set')::uuid, 'Puma Terry Sweatband Set', 'Puma', 'https://placehold.co/600x400/111827/ffffff.png?text=Puma+Sweatband', now()),
      -- NewBalance
      (md5('NB Athletics Backpack')::uuid, 'NB Athletics Backpack', 'NewBalance', 'https://placehold.co/600x400/111827/ffffff.png?text=NB+Backpack', now()),
      (md5('NB Running Visor')::uuid, 'NB Performance Visor', 'NewBalance', 'https://placehold.co/600x400/111827/ffffff.png?text=NB+Visor', now()),
      (md5('NB Armband')::uuid, 'NB Smartphone Armband', 'NewBalance', 'https://placehold.co/600x400/111827/ffffff.png?text=NB+Armband', now()),
      (md5('NB Running Belt')::uuid, 'NB Core Running Belt', 'NewBalance', 'https://placehold.co/600x400/111827/ffffff.png?text=NB+Belt', now()),
      (md5('NB No Show Socks')::uuid, 'NB Performance No Show Socks', 'NewBalance', 'https://placehold.co/600x400/111827/ffffff.png?text=NB+Socks', now()),
      -- ASICS
      (md5('ASICS Gel Kneepad')::uuid, 'ASICS Basic Kneepad', 'ASICS', 'https://placehold.co/600x400/111827/ffffff.png?text=ASICS+Kneepad', now()),
      (md5('ASICS Waistpack')::uuid, 'ASICS Katakana Waistpack', 'ASICS', 'https://placehold.co/600x400/111827/ffffff.png?text=ASICS+Waistpack', now()),
      (md5('ASICS Seamless Beanie')::uuid, 'ASICS Thermal Beanie', 'ASICS', 'https://placehold.co/600x400/111827/ffffff.png?text=ASICS+Beanie', now()),
      (md5('ASICS Quick Lyte')::uuid, 'ASICS Quick Lyte Cushion Socks', 'ASICS', 'https://placehold.co/600x400/111827/ffffff.png?text=ASICS+Socks', now()),
      (md5('ASICS Hydration Vest')::uuid, 'ASICS Fujitrail Hydration Vest', 'ASICS', 'https://placehold.co/600x400/111827/ffffff.png?text=ASICS+Vest', now()),
      -- Salomon
      (md5('Salomon Soft Flask')::uuid, 'Salomon Soft Flask 500ml', 'Salomon', 'https://placehold.co/600x400/111827/ffffff.png?text=Salomon+Flask', now()),
      (md5('Salomon Trail Gaiters')::uuid, 'Salomon High Trail Gaiters', 'Salomon', 'https://placehold.co/600x400/111827/ffffff.png?text=Salomon+Gaiters', now()),
      (md5('Salomon Active Belt')::uuid, 'Salomon Active Bottle Belt', 'Salomon', 'https://placehold.co/600x400/111827/ffffff.png?text=Salomon+Belt', now()),
      (md5('Salomon ADV Skin')::uuid, 'Salomon ADV Skin 12 Set', 'Salomon', 'https://placehold.co/600x400/111827/ffffff.png?text=Salomon+Skin+12', now()),
      (md5('Salomon Sense Beanie')::uuid, 'Salomon Lightweight Sense Beanie', 'Salomon', 'https://placehold.co/600x400/111827/ffffff.png?text=Salomon+Beanie', now())
    on conflict (id) do update 
      set 
        name = EXCLUDED.name, 
        brand = EXCLUDED.brand, 
        image_url = EXCLUDED.image_url,
        created_at = EXCLUDED.created_at
    returning id, name
  ),

  -- Assign exactly 2 random stores to each product using row_number()
  assigned_stores as (
    select 
      p.id as product_id, 
      s.id as store_id,
      row_number() over (partition by p.id order by random()) as rn
    from inserted_products p
    cross join inserted_stores s
  ),
  
  -- create product_prices: filter to take only the first 2 random stores per product
  created_prices as (
    select 
      md5(product_id::text || store_id::text)::uuid as id, 
      product_id, 
      store_id,
      ((random()*80)+20)::numeric(10,2) as price, 
      now() as updated_at
    from assigned_stores
    where rn <= 2
  ),

  ins_prices as (
    insert into public.product_prices (id, product_id, store_id, price, updated_at)
    select id, product_id, store_id, price, updated_at
    from created_prices
    on conflict (id) do update 
      set 
        price = EXCLUDED.price, 
        updated_at = EXCLUDED.updated_at
    returning id
  ),

  -- create multiple price_history entries per product (5 entries each)
  history_rows as (
    select 
      md5(p.id::text || g::text)::uuid as id, 
      p.id as product_id,
      ((random()*80)+20)::numeric(10,2) as price,
      (now() - (g || ' days')::interval) as recorded_at
    from inserted_products p
    cross join generate_series(0,4) g
  )

insert into public.price_history (id, product_id, price, recorded_at)
select id, product_id, price, recorded_at from history_rows
on conflict (id) do update 
  set 
    price = EXCLUDED.price, 
    recorded_at = EXCLUDED.recorded_at;

-- Insert favorites for first 3 products with the first active user (if auth.users has any rows)
-- This query is designed to run silently without syntax errors if auth schema is accessible.
do $$ 
declare 
  uid uuid;
begin
  -- Attempt to get the first user ID from auth.users
  select id into uid from auth.users order by created_at asc limit 1;
  
  -- If a user exists, insert favorites for them
  if uid is not null then
    insert into public.favorites (id, user_id, product_id, created_at)
    select 
      md5(uid::text || p.id::text)::uuid, 
      uid, 
      p.id, 
      now()
    from public.products p
    order by p.created_at asc
    limit 3
    on conflict (id) do nothing;
  else
    raise notice 'No users found in auth.users. Skipping favorites seed.';
  end if;
exception
  when others then 
    raise notice 'Could not access auth.users table (might not exist locally). Skipping favorites seed.';
end $$;
