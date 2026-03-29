alter table public.profiles
  add column if not exists username text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone_country_code text,
  add column if not exists phone_number text;

create unique index if not exists profiles_username_unique_idx on public.profiles (lower(username)) where username is not null;

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

create or replace function public.email_for_login_identifier(login_identifier text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.email
  from public.profiles p
  where lower(p.email) = lower(login_identifier)
     or lower(coalesce(p.username, '')) = lower(login_identifier)
  limit 1;
$$;

grant execute on function public.email_for_login_identifier(text) to anon, authenticated;

-- Rollback / recovery notes:
-- Snapshot before rollback:
--   create table if not exists public._snapshot_202603200003_profiles as table public.profiles;
--   create table if not exists public._snapshot_202603200003_profile_indexes as
--     select schemaname, tablename, indexname, indexdef
--     from pg_indexes
--     where schemaname = 'public' and tablename = 'profiles';
--   create table if not exists public._snapshot_202603200003_functions as
--     select n.nspname as schema_name, p.proname as function_name, pg_get_functiondef(p.oid) as definition
--     from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proname in ('handle_new_user', 'email_for_login_identifier');
-- Recovery rollback:
--   alter table public.profiles
--     drop column if exists username,
--     drop column if exists first_name,
--     drop column if exists last_name,
--     drop column if exists phone_country_code,
--     drop column if exists phone_number;
--   drop index if exists public.profiles_username_unique_idx;
--   drop function if exists public.email_for_login_identifier(text);
--   -- If needed, restore the previous public.handle_new_user() from snapshot SQL in public._snapshot_202603200003_functions.
-- Re-verify after rollback or restore:
--   select column_name from information_schema.columns where table_schema='public' and table_name='profiles' order by ordinal_position;
--   select indexname from pg_indexes where schemaname='public' and tablename='profiles' order by indexname;
--   select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname in ('handle_new_user','email_for_login_identifier') order by proname;

