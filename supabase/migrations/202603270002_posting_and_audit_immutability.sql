-- Posting + journal + immutable audit baseline (additive).
-- Adds posting-state entities, period locks, reversal linkage, and append-only guardrails.

create extension if not exists "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'posting_status') THEN
    CREATE TYPE public.posting_status AS ENUM ('draft', 'posted', 'reversed');
  END IF;
END $$;

create table if not exists public.period_locks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  locked_at timestamptz not null default now(),
  locked_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint period_locks_date_range_check check (start_date <= end_date)
);

create index if not exists period_locks_company_range_idx
  on public.period_locks (company_id, start_date, end_date);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_transaction_id uuid null references public.transactions(id) on delete restrict,
  reversal_of_journal_entry_id uuid null references public.journal_entries(id) on delete restrict,
  status public.posting_status not null default 'draft',
  posting_date date not null,
  description text not null,
  posted_at timestamptz null,
  posted_by uuid null references auth.users(id) on delete set null,
  reversed_at timestamptz null,
  reversed_by uuid null references auth.users(id) on delete set null,
  reversal_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posted_state_fields_check check (
    (status = 'draft' and posted_at is null and reversed_at is null)
    or (status = 'posted' and posted_at is not null and reversed_at is null)
    or (status = 'reversed' and posted_at is not null and reversed_at is not null)
  )
);

create index if not exists journal_entries_company_posting_date_idx
  on public.journal_entries (company_id, posting_date desc, created_at desc);
create index if not exists journal_entries_source_transaction_idx
  on public.journal_entries (source_transaction_id)
  where source_transaction_id is not null;
create unique index if not exists journal_entries_single_reversal_idx
  on public.journal_entries (reversal_of_journal_entry_id)
  where reversal_of_journal_entry_id is not null;

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  line_no integer not null,
  account_code text not null,
  direction text not null,
  amount numeric(12,2) not null,
  description text,
  created_at timestamptz not null default now(),
  constraint journal_lines_line_no_check check (line_no > 0),
  constraint journal_lines_direction_check check (direction in ('debit', 'credit')),
  constraint journal_lines_amount_check check (amount > 0),
  unique (journal_entry_id, line_no)
);

create index if not exists journal_lines_entry_idx on public.journal_lines (journal_entry_id, line_no);
create index if not exists journal_lines_company_idx on public.journal_lines (company_id, created_at desc);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid null references auth.users(id) on delete set null,
  entity_table text not null,
  entity_id uuid not null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists audit_events_company_occurred_idx on public.audit_events (company_id, occurred_at desc);
create index if not exists audit_events_entity_idx on public.audit_events (entity_table, entity_id, occurred_at desc);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_posted_transaction_mutation()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.journal_entries je
    where je.source_transaction_id = coalesce(new.id, old.id)
      and je.status in ('posted', 'reversed')
  ) then
    raise exception 'Cannot mutate transaction with posted journal entries. Use reversal or adjustment posting.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_finalized_journal_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.status in ('posted', 'reversed') then
    raise exception 'Cannot mutate finalized journal entries. Use reversal or adjustment posting.';
  end if;

  if tg_op = 'UPDATE' and old.status in ('posted', 'reversed') then
    if old.status = 'posted'
      and new.status = 'reversed'
      and new.reversed_at is not null
      and new.reversed_by is not null then
      return new;
    end if;

    raise exception 'Cannot mutate finalized journal entries. Use reversal or adjustment posting.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events is append-only; updates and deletes are not permitted';
end;
$$;

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
before update on public.journal_entries
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists prevent_posted_transaction_update on public.transactions;
create trigger prevent_posted_transaction_update
before update on public.transactions
for each row
execute function public.prevent_posted_transaction_mutation();

drop trigger if exists prevent_posted_transaction_delete on public.transactions;
create trigger prevent_posted_transaction_delete
before delete on public.transactions
for each row
execute function public.prevent_posted_transaction_mutation();

drop trigger if exists prevent_finalized_journal_update on public.journal_entries;
create trigger prevent_finalized_journal_update
before update on public.journal_entries
for each row
execute function public.prevent_finalized_journal_mutation();

drop trigger if exists prevent_finalized_journal_delete on public.journal_entries;
create trigger prevent_finalized_journal_delete
before delete on public.journal_entries
for each row
execute function public.prevent_finalized_journal_mutation();

drop trigger if exists prevent_audit_event_update on public.audit_events;
create trigger prevent_audit_event_update
before update on public.audit_events
for each row
execute function public.prevent_audit_event_mutation();

drop trigger if exists prevent_audit_event_delete on public.audit_events;
create trigger prevent_audit_event_delete
before delete on public.audit_events
for each row
execute function public.prevent_audit_event_mutation();

alter table public.period_locks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "Members manage period locks" on public.period_locks;
create policy "Members manage period locks" on public.period_locks
  for all to authenticated
  using (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = period_locks.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = period_locks.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members manage journal entries" on public.journal_entries;
create policy "Members manage journal entries" on public.journal_entries
  for all to authenticated
  using (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = journal_entries.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = journal_entries.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members manage journal lines" on public.journal_lines;
create policy "Members manage journal lines" on public.journal_lines
  for all to authenticated
  using (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = journal_lines.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = journal_lines.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members insert and view audit events" on public.audit_events;
create policy "Members insert and view audit events" on public.audit_events
  for all to authenticated
  using (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = audit_events.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = audit_events.company_id
        and cm.user_id = auth.uid()
    )
  );

-- Rollback / recovery notes:
-- - This migration is additive for new tables/types/indexes and introduces triggers/policies on new tables plus transaction immutability triggers.
-- - Rollback SQL (destructive to new posting/audit data):
--   drop policy if exists "Members insert and view audit events" on public.audit_events;
--   drop policy if exists "Members manage journal lines" on public.journal_lines;
--   drop policy if exists "Members manage journal entries" on public.journal_entries;
--   drop policy if exists "Members manage period locks" on public.period_locks;
--   drop trigger if exists prevent_audit_event_delete on public.audit_events;
--   drop trigger if exists prevent_audit_event_update on public.audit_events;
--   drop trigger if exists prevent_finalized_journal_delete on public.journal_entries;
--   drop trigger if exists prevent_finalized_journal_update on public.journal_entries;
--   drop trigger if exists prevent_posted_transaction_delete on public.transactions;
--   drop trigger if exists prevent_posted_transaction_update on public.transactions;
--   drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
--   drop function if exists public.prevent_audit_event_mutation();
--   drop function if exists public.prevent_finalized_journal_mutation();
--   drop function if exists public.prevent_posted_transaction_mutation();
--   drop function if exists public.set_updated_at_timestamp();
--   drop table if exists public.audit_events;
--   drop table if exists public.journal_lines;
--   drop table if exists public.journal_entries;
--   drop table if exists public.period_locks;
--   drop type if exists public.posting_status;
-- - Recovery guidance:
--   1) Take a snapshot backup of period_locks, journal_entries, journal_lines, and audit_events before rollback.
--   2) If rollback was accidental, reapply this migration and restore snapshots.
--   3) Re-verify transaction update/delete behavior for posted records and audit append-only enforcement.
