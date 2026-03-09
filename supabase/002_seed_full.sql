-- Full seed for development/testing
-- Run after 001_create_tables.sql

-- Insert stores and products, capture IDs, then create prices and history
with
  inserted_stores as (
    insert into public.stores (id, name, logo_url)
    values
      (gen_random_uuid(), 'SportMart', 'https://example.com/logos/sportmart.png'),
      (gen_random_uuid(), 'RunnerHub', 'https://example.com/logos/runnerhub.png'),
      (gen_random_uuid(), 'FastShoes', 'https://example.com/logos/fastshoes.png'),
      (gen_random_uuid(), 'OutdoorPro', 'https://example.com/logos/outdoorpro.png')
    on conflict do nothing
    returning id, name
  ),

  inserted_products as (
    insert into public.products (id, name, brand, image_url, created_at)
    values
      (gen_random_uuid(), 'AirZoom Pro', 'Nike', 'https://example.com/images/airzoom.jpg', now()),
      (gen_random_uuid(), 'UltraRun 3000', 'Adidas', 'https://example.com/images/ultrarun.jpg', now()),
      (gen_random_uuid(), 'TrailBlazer', 'Salomon', 'https://example.com/images/trailblazer.jpg', now()),
      (gen_random_uuid(), 'SpeedX Elite', 'Puma', 'https://example.com/images/speedx.jpg', now()),
      (gen_random_uuid(), 'CityRunner', 'NewBalance', 'https://example.com/images/cityrunner.jpg', now()),
      (gen_random_uuid(), 'MarathonMaster', 'ASICS', 'https://example.com/images/marathon.jpg', now()),
      (gen_random_uuid(), 'GripTrail', 'Merrell', 'https://example.com/images/griptrail.jpg', now()),
      (gen_random_uuid(), 'ComfortWalk', 'Reebok', 'https://example.com/images/comfortwalk.jpg', now())
    on conflict do nothing
    returning id, name
  ),

  -- create product_prices: link each product to 2 random stores with a price
  created_prices as (
    select gen_random_uuid() as id, p.id as product_id, s.id as store_id,
      ((random()*80)+20)::numeric(10,2) as price, now() as updated_at
    from inserted_products p
    join inserted_stores s on ( ( (hashtext(p.name || s.name))::bigint % 4 ) >= 0 )
  ),

  ins_prices as (
    insert into public.product_prices (id, product_id, store_id, price, updated_at)
    select id, product_id, store_id, price, updated_at
    from created_prices
    returning id
  ),

  -- create multiple price_history entries per product (5 entries each)
  history_rows as (
    select gen_random_uuid() as id, p.id as product_id,
      ((random()*80)+20)::numeric(10,2) as price,
      (now() - (g || ' days')::interval) as recorded_at
    from inserted_products p
    cross join generate_series(0,4) g
  )

insert into public.price_history (id, product_id, price, recorded_at)
select id, product_id, price, recorded_at from history_rows
on conflict do nothing;

-- Insert favorites for first 3 products with placeholder user ids (replace with real auth.uid() when ready)
with first_products as (
  select id from public.products order by created_at asc limit 3
)
insert into public.favorites (id, user_id, product_id, created_at)
select gen_random_uuid(), gen_random_uuid() as user_id, fp.id, now()
from first_products fp
on conflict do nothing;

-- Notes:
-- - This script creates multiple records for development; for production use migrate/seed carefully.
-- - Replace placeholder user_id values with real auth UIDs if you want to test user-specific behavior.
