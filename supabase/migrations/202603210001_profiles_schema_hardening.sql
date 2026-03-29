create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone_country_code text,
  add column if not exists phone_number text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_username_unique_idx on public.profiles (lower(username)) where username is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, first_name, last_name, phone_country_code, phone_number)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone_country_code'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone_number'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        username = excluded.username,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        phone_country_code = excluded.phone_country_code,
        phone_number = excluded.phone_number,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant usage on schema public to authenticated;
grant select, insert, update on table public.profiles to authenticated;

notify pgrst, 'reload schema';

-- Rollback / recovery notes:
-- Snapshot before rollback:
--   create table if not exists public._snapshot_202603210001_profiles as table public.profiles;
--   create table if not exists public._snapshot_202603210001_profile_policies as
--     select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--     from pg_policies
--     where schemaname = 'public' and tablename = 'profiles';
--   create table if not exists public._snapshot_202603210001_profile_functions as
--     select n.nspname as schema_name, p.proname as function_name, pg_get_functiondef(p.oid) as definition
--     from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname='public' and p.proname in ('set_updated_at','handle_new_user');
-- Recovery rollback:
--   drop trigger if exists set_profiles_updated_at on public.profiles;
--   drop function if exists public.set_updated_at();
--   drop trigger if exists on_auth_user_created on auth.users;
--   -- Restore prior public.handle_new_user() body from snapshot if profile signup fields should no longer be hydrated.
--   revoke select, insert, update on table public.profiles from authenticated;
-- Re-verify after rollback or restore:
--   select tgname from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal order by tgname;
--   select policyname, cmd from pg_policies where schemaname='public' and tablename='profiles' order by policyname;
--   select grantee, privilege_type from information_schema.role_table_grants where table_schema='public' and table_name='profiles' and grantee='authenticated' order by privilege_type;

