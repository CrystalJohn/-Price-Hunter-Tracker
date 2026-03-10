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
      (md5('Air Zoom Pegasus')::uuid, 'Air Zoom Pegasus', 'Nike', 'https://example.com/images/pegasus.jpg', now()),
      (md5('React Infinity')::uuid, 'React Infinity', 'Nike', 'https://example.com/images/infinity.jpg', now()),
      (md5('ZoomX Vaporfly')::uuid, 'ZoomX Vaporfly', 'Nike', 'https://example.com/images/vaporfly.jpg', now()),
      (md5('Air Force 1 Run')::uuid, 'Air Force 1 Run', 'Nike', 'https://example.com/images/af1.jpg', now()),
      (md5('Zoom Fly 5')::uuid, 'Zoom Fly 5', 'Nike', 'https://example.com/images/zoomfly.jpg', now()),
      -- Adidas
      (md5('Ultraboost 23')::uuid, 'Ultraboost 23', 'Adidas', 'https://example.com/images/ultraboost.jpg', now()),
      (md5('Adizero Adios')::uuid, 'Adizero Adios', 'Adidas', 'https://example.com/images/adizero.jpg', now()),
      (md5('Solar Glide')::uuid, 'Solar Glide', 'Adidas', 'https://example.com/images/solar.jpg', now()),
      (md5('Boston 12')::uuid, 'Boston 12', 'Adidas', 'https://example.com/images/boston.jpg', now()),
      (md5('NMD R1 Run')::uuid, 'NMD R1 Run', 'Adidas', 'https://example.com/images/nmd.jpg', now()),
      -- Puma
      (md5('Velocity Nitro')::uuid, 'Velocity Nitro', 'Puma', 'https://example.com/images/velocity.jpg', now()),
      (md5('Deviate Nitro')::uuid, 'Deviate Nitro', 'Puma', 'https://example.com/images/deviate.jpg', now()),
      (md5('Magnify Nitro')::uuid, 'Magnify Nitro', 'Puma', 'https://example.com/images/magnify.jpg', now()),
      (md5('Fast-R Elite')::uuid, 'Fast-R Elite', 'Puma', 'https://example.com/images/fastr.jpg', now()),
      (md5('Electrify Pro')::uuid, 'Electrify Pro', 'Puma', 'https://example.com/images/electrify.jpg', now()),
      -- NewBalance
      (md5('Fresh Foam 1080')::uuid, 'Fresh Foam 1080', 'NewBalance', 'https://example.com/images/1080.jpg', now()),
      (md5('FuelCell Rebel')::uuid, 'FuelCell Rebel', 'NewBalance', 'https://example.com/images/rebel.jpg', now()),
      (md5('860v13')::uuid, '860v13', 'NewBalance', 'https://example.com/images/860.jpg', now()),
      (md5('More v4')::uuid, 'More v4', 'NewBalance', 'https://example.com/images/more.jpg', now()),
      (md5('Propel v4')::uuid, 'Propel v4', 'NewBalance', 'https://example.com/images/propel.jpg', now()),
      -- ASICS
      (md5('Gel-Kayano 30')::uuid, 'Gel-Kayano 30', 'ASICS', 'https://example.com/images/kayano.jpg', now()),
      (md5('Gel-Nimbus 25')::uuid, 'Gel-Nimbus 25', 'ASICS', 'https://example.com/images/nimbus.jpg', now()),
      (md5('Novablast 3')::uuid, 'Novablast 3', 'ASICS', 'https://example.com/images/novablast.jpg', now()),
      (md5('Magic Speed')::uuid, 'Magic Speed', 'ASICS', 'https://example.com/images/magic.jpg', now()),
      (md5('Cumulus 25')::uuid, 'Cumulus 25', 'ASICS', 'https://example.com/images/cumulus.jpg', now()),
      -- Salomon
      (md5('Speedcross 6')::uuid, 'Speedcross 6', 'Salomon', 'https://example.com/images/speedcross.jpg', now()),
      (md5('Sense Ride 5')::uuid, 'Sense Ride 5', 'Salomon', 'https://example.com/images/sense.jpg', now()),
      (md5('Ultra Glide 2')::uuid, 'Ultra Glide 2', 'Salomon', 'https://example.com/images/ultra.jpg', now()),
      (md5('Supercross 4')::uuid, 'Supercross 4', 'Salomon', 'https://example.com/images/supercross.jpg', now()),
      (md5('Pulsar Trail')::uuid, 'Pulsar Trail', 'Salomon', 'https://example.com/images/pulsar.jpg', now())
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
