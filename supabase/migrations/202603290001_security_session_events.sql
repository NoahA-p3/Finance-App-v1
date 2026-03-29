-- Dedicated append-only security session event log for user-scoped session actions.

create table if not exists public.security_session_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_session_id uuid not null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint security_session_events_event_type_check check (event_type in ('session.revoked'))
);

create index if not exists security_session_events_actor_occurred_idx
  on public.security_session_events (actor_user_id, occurred_at desc);

create index if not exists security_session_events_target_occurred_idx
  on public.security_session_events (target_session_id, occurred_at desc);

create or replace function public.prevent_security_session_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'security_session_events is append-only; updates and deletes are not permitted';
end;
$$;

drop trigger if exists prevent_security_session_event_update on public.security_session_events;
create trigger prevent_security_session_event_update
before update on public.security_session_events
for each row execute function public.prevent_security_session_event_mutation();

drop trigger if exists prevent_security_session_event_delete on public.security_session_events;
create trigger prevent_security_session_event_delete
before delete on public.security_session_events
for each row execute function public.prevent_security_session_event_mutation();

alter table public.security_session_events enable row level security;

drop policy if exists "Users read own security session events" on public.security_session_events;
create policy "Users read own security session events" on public.security_session_events
  for select to authenticated
  using (actor_user_id = auth.uid());

drop policy if exists "Users insert own security session events" on public.security_session_events;
create policy "Users insert own security session events" on public.security_session_events
  for insert to authenticated
  with check (actor_user_id = auth.uid());

-- Rollback / recovery notes:
-- - This migration is additive and introduces a new append-only security table.
-- - Before rollback, export rows from `public.security_session_events` if security forensics retention is required.
-- - Rollback SQL:
--   drop policy if exists "Users insert own security session events" on public.security_session_events;
--   drop policy if exists "Users read own security session events" on public.security_session_events;
--   drop trigger if exists prevent_security_session_event_delete on public.security_session_events;
--   drop trigger if exists prevent_security_session_event_update on public.security_session_events;
--   drop function if exists public.prevent_security_session_event_mutation();
--   drop table if exists public.security_session_events;
