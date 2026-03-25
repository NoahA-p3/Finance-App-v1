-- Active company context + company-scoped finance hardening (additive).
-- Adds persisted active company selection, expands company settings, and enforces company_id on finance tables.

alter table public.profiles
  add column if not exists active_company_id uuid references public.companies(id) on delete set null;

create index if not exists profiles_active_company_idx on public.profiles (active_company_id);

-- Expanded persisted company settings fields.
alter table public.company_settings
  add column if not exists invoice_prefix text,
  add column if not exists invoice_terms text,
  add column if not exists invoice_due_days smallint,
  add column if not exists logo_storage_path text,
  add column if not exists logo_file_name text,
  add column if not exists logo_content_type text,
  add column if not exists logo_file_size_bytes bigint,
  add column if not exists branch_label text,
  add column if not exists department_label text,
  add column if not exists cvr_number text;

alter table public.company_settings
  drop constraint if exists company_settings_invoice_due_days_check;

alter table public.company_settings
  add constraint company_settings_invoice_due_days_check
  check (invoice_due_days is null or (invoice_due_days between 1 and 365));

alter table public.company_settings
  drop constraint if exists company_settings_logo_file_size_bytes_check;

alter table public.company_settings
  add constraint company_settings_logo_file_size_bytes_check
  check (logo_file_size_bytes is null or logo_file_size_bytes >= 0);

alter table public.company_settings
  drop constraint if exists company_settings_cvr_number_check;

alter table public.company_settings
  add constraint company_settings_cvr_number_check
  check (cvr_number is null or cvr_number ~ '^[0-9]{8}$');

-- Add company scoping to finance tables.
alter table public.categories
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

alter table public.transactions
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

alter table public.receipts
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

create index if not exists categories_company_user_idx on public.categories (company_id, user_id, created_at desc);
create index if not exists transactions_company_user_date_idx on public.transactions (company_id, user_id, date desc);
create index if not exists receipts_company_user_created_idx on public.receipts (company_id, user_id, created_at desc);

-- Best-effort backfill: assign existing user-owned rows to user's earliest membership company.
with membership_source as (
  select distinct on (user_id) user_id, company_id
  from public.company_memberships
  order by user_id, created_at asc
)
update public.categories c
set company_id = ms.company_id
from membership_source ms
where c.company_id is null
  and c.user_id = ms.user_id;

with membership_source as (
  select distinct on (user_id) user_id, company_id
  from public.company_memberships
  order by user_id, created_at asc
)
update public.transactions t
set company_id = ms.company_id
from membership_source ms
where t.company_id is null
  and t.user_id = ms.user_id;

with membership_source as (
  select distinct on (user_id) user_id, company_id
  from public.company_memberships
  order by user_id, created_at asc
)
update public.receipts r
set company_id = ms.company_id
from membership_source ms
where r.company_id is null
  and r.user_id = ms.user_id;

-- Align active company with current membership where missing.
update public.profiles p
set active_company_id = ms.company_id
from (
  select distinct on (user_id) user_id, company_id
  from public.company_memberships
  order by user_id, created_at asc
) ms
where p.id = ms.user_id
  and p.active_company_id is null;

-- Harden RLS policies to require same-company membership.
drop policy if exists "Users manage own categories" on public.categories;
create policy "Users manage own categories" on public.categories
  for all to authenticated
  using (
    user_id = auth.uid()
    and company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Users manage own receipts" on public.receipts;
create policy "Users manage own receipts" on public.receipts
  for all to authenticated
  using (
    user_id = auth.uid()
    and company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions" on public.transactions
  for all to authenticated
  using (
    user_id = auth.uid()
    and company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
    )
  );

-- Keep nullable to avoid destructive migration failures where no membership exists yet.
-- Runtime API now requires resolved active company and only writes non-null company_id.

-- Rollback / recovery notes:
-- - This migration is additive, plus policy replacement and best-effort backfills.
-- - Rollback SQL (destructive to new fields/data links):
--   alter table public.profiles drop column if exists active_company_id;
--   alter table public.company_settings drop constraint if exists company_settings_invoice_due_days_check;
--   alter table public.company_settings drop constraint if exists company_settings_logo_file_size_bytes_check;
--   alter table public.company_settings drop constraint if exists company_settings_cvr_number_check;
--   alter table public.company_settings
--     drop column if exists invoice_prefix,
--     drop column if exists invoice_terms,
--     drop column if exists invoice_due_days,
--     drop column if exists logo_storage_path,
--     drop column if exists logo_file_name,
--     drop column if exists logo_content_type,
--     drop column if exists logo_file_size_bytes,
--     drop column if exists branch_label,
--     drop column if exists department_label,
--     drop column if exists cvr_number;
--   alter table public.categories drop column if exists company_id;
--   alter table public.transactions drop column if exists company_id;
--   alter table public.receipts drop column if exists company_id;
-- - Recovery guidance:
--   1) Snapshot profiles/company_settings/categories/transactions/receipts before rollback.
--   2) Re-apply this migration and restore snapshots if rollback was accidental.
--   3) Re-validate RLS behavior for same-company vs cross-company access.
