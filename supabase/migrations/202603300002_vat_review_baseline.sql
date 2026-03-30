-- VAT review baseline schema + RLS (VAT-RVW-001).
-- Adds company-scoped review persistence tables and global/company VAT code scope handling.

create table if not exists public.vat_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid null references public.companies(id) on delete cascade,
  code text not null,
  description text not null,
  rate_decimal numeric(9,6) not null,
  direction text not null check (direction in ('input', 'output')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,
  constraint vat_codes_rate_non_negative_check check (rate_decimal >= 0)
);

create unique index if not exists vat_codes_global_code_unique_idx
  on public.vat_codes (code)
  where company_id is null;

create unique index if not exists vat_codes_company_code_unique_idx
  on public.vat_codes (company_id, code)
  where company_id is not null;

create index if not exists vat_codes_company_active_idx
  on public.vat_codes (company_id, is_active, direction, code);

create table if not exists public.vat_review_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  engine_version text not null,
  input_hash text not null,
  result_json jsonb not null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint vat_review_runs_period_range_check check (period_start <= period_end)
);

create index if not exists vat_review_runs_company_period_idx
  on public.vat_review_runs (company_id, period_start desc, period_end desc, created_at desc);

create index if not exists vat_review_runs_company_input_hash_idx
  on public.vat_review_runs (company_id, input_hash, engine_version);

create table if not exists public.vat_period_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  output_vat_total numeric(12,2) not null default 0,
  input_vat_total numeric(12,2) not null default 0,
  net_vat_decimal numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'filed')),
  approved_by uuid null references auth.users(id) on delete set null,
  approved_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vat_period_reviews_period_range_check check (period_start <= period_end),
  constraint vat_period_reviews_unique_period unique (company_id, period_start, period_end)
);

create index if not exists vat_period_reviews_company_status_idx
  on public.vat_period_reviews (company_id, status, period_start desc);

drop trigger if exists vat_period_reviews_set_updated_at on public.vat_period_reviews;
create trigger vat_period_reviews_set_updated_at
before update on public.vat_period_reviews
for each row execute function public.set_updated_at();

create table if not exists public.vat_review_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  vat_period_review_id uuid not null references public.vat_period_reviews(id) on delete cascade,
  event_type text not null,
  event_payload_json jsonb not null default '{}'::jsonb,
  performed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists vat_review_events_review_occurred_idx
  on public.vat_review_events (vat_period_review_id, created_at desc);

create index if not exists vat_review_events_company_occurred_idx
  on public.vat_review_events (company_id, created_at desc);

create or replace function public.prevent_vat_review_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'vat_review_events is append-only; updates and deletes are not permitted';
end;
$$;

drop trigger if exists prevent_vat_review_event_update on public.vat_review_events;
create trigger prevent_vat_review_event_update
before update on public.vat_review_events
for each row
execute function public.prevent_vat_review_event_mutation();

drop trigger if exists prevent_vat_review_event_delete on public.vat_review_events;
create trigger prevent_vat_review_event_delete
before delete on public.vat_review_events
for each row
execute function public.prevent_vat_review_event_mutation();

alter table public.vat_codes enable row level security;
alter table public.vat_review_runs enable row level security;
alter table public.vat_period_reviews enable row level security;
alter table public.vat_review_events enable row level security;

-- VAT code visibility: all company members can read own-company codes + global defaults.
drop policy if exists "Members read global and company VAT codes" on public.vat_codes;
create policy "Members read global and company VAT codes" on public.vat_codes
  for select to authenticated
  using (
    company_id is null
    or exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_codes.company_id
        and cm.user_id = auth.uid()
    )
  );

-- VAT code mutation: baseline privileged roles only.
-- TODO: include explicit `admin` role once repo role contract includes admin.
drop policy if exists "Privileged members manage company VAT codes" on public.vat_codes;
create policy "Privileged members manage company VAT codes" on public.vat_codes
  for all to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_codes.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'accountant')
    )
  )
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_codes.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'accountant')
    )
  );

drop policy if exists "Members read company VAT review runs" on public.vat_review_runs;
create policy "Members read company VAT review runs" on public.vat_review_runs
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_review_runs.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Privileged members mutate company VAT review runs" on public.vat_review_runs;
create policy "Privileged members mutate company VAT review runs" on public.vat_review_runs
  for all to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_review_runs.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'accountant')
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_review_runs.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'accountant')
    )
  );

drop policy if exists "Members read company VAT period reviews" on public.vat_period_reviews;
create policy "Members read company VAT period reviews" on public.vat_period_reviews
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_period_reviews.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Privileged members mutate company VAT period reviews" on public.vat_period_reviews;
create policy "Privileged members mutate company VAT period reviews" on public.vat_period_reviews
  for all to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_period_reviews.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'accountant')
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_period_reviews.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'accountant')
    )
  );

drop policy if exists "Members read company VAT review events" on public.vat_review_events;
create policy "Members read company VAT review events" on public.vat_review_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_review_events.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Privileged members insert company VAT review events" on public.vat_review_events;
create policy "Privileged members insert company VAT review events" on public.vat_review_events
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = vat_review_events.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'accountant')
    )
  );

grant select, insert, update, delete on public.vat_codes to authenticated;
grant select, insert, update, delete on public.vat_review_runs to authenticated;
grant select, insert, update, delete on public.vat_period_reviews to authenticated;
grant select, insert on public.vat_review_events to authenticated;

-- Baseline global VAT codes for deterministic preview scaffold.
insert into public.vat_codes (company_id, code, description, rate_decimal, direction, is_active)
values
  (null, 'DK_OUTPUT_25', 'Baseline output VAT 25% (global default)', 0.25, 'output', true),
  (null, 'DK_INPUT_25', 'Baseline input VAT 25% (global default)', 0.25, 'input', true)
on conflict do nothing;

-- Rollback / recovery notes:
-- 1) Disable VAT review API routes before rollback to avoid writes/reads against removed relations.
-- 2) Snapshot review state for parity checks before dropping tables:
--      create table if not exists public._snapshot_202603300002_vat_review_runs as
--      select * from public.vat_review_runs;
--      create table if not exists public._snapshot_202603300002_vat_period_reviews as
--      select * from public.vat_period_reviews;
-- 3) Remove in reverse dependency order:
--      drop table if exists public.vat_review_events;
--      drop table if exists public.vat_period_reviews;
--      drop table if exists public.vat_review_runs;
--      drop table if exists public.vat_codes;
-- 4) Re-run deterministic preview checks for known golden periods after restore to confirm parity.
