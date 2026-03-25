-- Canonical runtime additive company bootstrap schema.
-- Scope: auth.users -> profiles + companies/company_memberships/company_settings.
-- Intentionally does not touch legacy public.users/public.accounts branch.

create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) > 0),
  vat_registered boolean not null default false,
  contact_email text,
  contact_phone text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country_code char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists company_memberships_user_idx on public.company_memberships (user_id);
create index if not exists company_memberships_company_idx on public.company_memberships (company_id);

create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  base_currency char(3) not null default 'DKK' check (base_currency = upper(base_currency)),
  fiscal_year_start_month smallint not null default 1 check (fiscal_year_start_month between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure updated_at trigger function exists for mutable entities.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists set_company_settings_updated_at on public.company_settings;
create trigger set_company_settings_updated_at
before update on public.company_settings
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_settings enable row level security;

-- Companies: users can create companies they own; read/update only where membership exists.
drop policy if exists "Users create own companies" on public.companies;
create policy "Users create own companies" on public.companies
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Members view companies" on public.companies;
create policy "Members view companies" on public.companies
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Owners update companies" on public.companies;
create policy "Owners update companies" on public.companies
  for update to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

-- Memberships: users can read their own memberships.
-- Insert is self-only and restricted to companies the user created (bootstrap-safe).
drop policy if exists "Users view own memberships" on public.company_memberships;
create policy "Users view own memberships" on public.company_memberships
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users create own owner membership" on public.company_memberships;
create policy "Users create own owner membership" on public.company_memberships
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.companies c
      where c.id = company_memberships.company_id
        and c.created_by = auth.uid()
    )
  );

-- Company settings: only members can read; only owners can insert/update.
drop policy if exists "Members view company settings" on public.company_settings;
create policy "Members view company settings" on public.company_settings
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_settings.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Owners insert company settings" on public.company_settings;
create policy "Owners insert company settings" on public.company_settings
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_settings.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

drop policy if exists "Owners update company settings" on public.company_settings;
create policy "Owners update company settings" on public.company_settings
  for update to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_settings.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_settings.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

grant select, insert, update on public.companies to authenticated;
grant select, insert on public.company_memberships to authenticated;
grant select, insert, update on public.company_settings to authenticated;

-- Rollback / recovery notes:
-- - This migration is additive. Existing canonical runtime tables remain unchanged.
-- - Rollback SQL (destructive for new company data):
--   drop table if exists public.company_settings;
--   drop table if exists public.company_memberships;
--   drop table if exists public.companies;
-- - Recovery guidance:
--   1) Snapshot rows from companies/company_memberships/company_settings before rollback.
--   2) Re-apply this migration and restore data from snapshot if rollback was accidental.
--   3) Re-validate RLS with authenticated user tests for same-company vs cross-company access.
