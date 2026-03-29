create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
    set email = excluded.email,
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
  for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Rollback / recovery notes:
-- Snapshot before rollback:
--   create table if not exists public._snapshot_202603200002_profiles as table public.profiles;
--   create table if not exists public._snapshot_202603200002_profile_policies as
--     select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--     from pg_policies
--     where schemaname = 'public' and tablename = 'profiles';
--   create table if not exists public._snapshot_202603200002_auth_triggers as
--     select tgname, tgrelid::regclass::text as table_name, tgfoid::regproc::text as function_name
--     from pg_trigger
--     where tgrelid = 'auth.users'::regclass and not tgisinternal;
-- Recovery rollback:
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop function if exists public.handle_new_user();
--   drop table if exists public.profiles cascade;
-- Re-verify after rollback or restore:
--   select to_regclass('public.profiles') as profiles_table;
--   select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal order by tgname;
--   select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'profiles';

