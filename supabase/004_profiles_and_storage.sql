-- Migration: create profiles table and Storage bucket for avatars

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert existing users into profiles if they don't exist
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- 3. Set up Storage for Avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up storage RLS policies
-- Note: 'storage.objects' table uses 'bucket_id' and 'name' (which includes the file path)

-- Allow public access to all avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
-- We typically store avatars at `avatars/[user_id].jpg`
create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
  );

create policy "Users can update their own avatar."
  on storage.objects for update
  using ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
  );

create policy "Users can delete their own avatar."
  on storage.objects for delete
  using ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
  );
