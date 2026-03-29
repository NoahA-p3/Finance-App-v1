-- Durable append-only retry queue for security session event delivery failures.
-- Extends security_session_events with an idempotency key for safe replay.

alter table public.security_session_events
  add column if not exists idempotency_key text;

update public.security_session_events
set idempotency_key = concat(
  event_type,
  ':',
  actor_user_id::text,
  ':',
  target_session_id::text,
  ':',
  to_char(occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
)
where idempotency_key is null;

alter table public.security_session_events
  alter column idempotency_key set not null;

create unique index if not exists security_session_events_idempotency_key_uidx
  on public.security_session_events (idempotency_key);

create table if not exists public.security_event_retry_queue (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_session_id uuid not null,
  event_type text not null,
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  enqueued_at timestamptz not null default now(),
  constraint security_event_retry_queue_event_type_check check (event_type in ('session.revoked')),
  constraint security_event_retry_queue_metadata_shape_check check (jsonb_typeof(metadata) = 'object'),
  constraint security_event_retry_queue_metadata_empty_check check (metadata = '{}'::jsonb),
  constraint security_event_retry_queue_idempotency_key_key unique (idempotency_key)
);

create index if not exists security_event_retry_queue_enqueued_idx
  on public.security_event_retry_queue (enqueued_at asc);

create index if not exists security_event_retry_queue_actor_idx
  on public.security_event_retry_queue (actor_user_id, enqueued_at desc);

create table if not exists public.security_event_retry_attempts (
  id bigint generated always as identity primary key,
  queue_id uuid not null references public.security_event_retry_queue(id) on delete cascade,
  idempotency_key text not null,
  attempted_at timestamptz not null default now(),
  worker_id text not null,
  delivery_status text not null,
  delivered_event_id uuid null references public.security_session_events(id),
  error_code text null,
  error_message text null,
  constraint security_event_retry_attempts_delivery_status_check
    check (delivery_status in ('delivered', 'retryable_failure', 'permanent_failure')),
  constraint security_event_retry_attempts_error_message_length_check
    check (error_message is null or char_length(error_message) <= 240)
);

create index if not exists security_event_retry_attempts_queue_attempted_idx
  on public.security_event_retry_attempts (queue_id, attempted_at desc);

create or replace function public.prevent_security_event_retry_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'security retry queue tables are append-only; updates and deletes are not permitted';
end;
$$;

drop trigger if exists prevent_security_event_retry_queue_update on public.security_event_retry_queue;
create trigger prevent_security_event_retry_queue_update
before update on public.security_event_retry_queue
for each row execute function public.prevent_security_event_retry_mutation();

drop trigger if exists prevent_security_event_retry_queue_delete on public.security_event_retry_queue;
create trigger prevent_security_event_retry_queue_delete
before delete on public.security_event_retry_queue
for each row execute function public.prevent_security_event_retry_mutation();

drop trigger if exists prevent_security_event_retry_attempt_update on public.security_event_retry_attempts;
create trigger prevent_security_event_retry_attempt_update
before update on public.security_event_retry_attempts
for each row execute function public.prevent_security_event_retry_mutation();

drop trigger if exists prevent_security_event_retry_attempt_delete on public.security_event_retry_attempts;
create trigger prevent_security_event_retry_attempt_delete
before delete on public.security_event_retry_attempts
for each row execute function public.prevent_security_event_retry_mutation();

alter table public.security_event_retry_queue enable row level security;
alter table public.security_event_retry_attempts enable row level security;

drop policy if exists "Users read own security retry queue events" on public.security_event_retry_queue;
create policy "Users read own security retry queue events" on public.security_event_retry_queue
  for select to authenticated
  using (actor_user_id = auth.uid());

drop policy if exists "Users insert own security retry queue events" on public.security_event_retry_queue;
create policy "Users insert own security retry queue events" on public.security_event_retry_queue
  for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and metadata = '{}'::jsonb
    and event_type = 'session.revoked'
  );

-- Queue attempts are internal replay telemetry; do not expose to authenticated users.

drop policy if exists "No direct access to security retry attempts" on public.security_event_retry_attempts;
create policy "No direct access to security retry attempts" on public.security_event_retry_attempts
  for all to authenticated
  using (false)
  with check (false);

-- Rollback / recovery notes:
-- - This migration is additive and should preserve existing runtime behavior.
-- - Before rollback, export rows from:
--   - public.security_session_events (including idempotency_key)
--   - public.security_event_retry_queue
--   - public.security_event_retry_attempts
-- - Rollback SQL (destructive; only after backup):
--   drop policy if exists "No direct access to security retry attempts" on public.security_event_retry_attempts;
--   drop policy if exists "Users insert own security retry queue events" on public.security_event_retry_queue;
--   drop policy if exists "Users read own security retry queue events" on public.security_event_retry_queue;
--   drop trigger if exists prevent_security_event_retry_attempt_delete on public.security_event_retry_attempts;
--   drop trigger if exists prevent_security_event_retry_attempt_update on public.security_event_retry_attempts;
--   drop trigger if exists prevent_security_event_retry_queue_delete on public.security_event_retry_queue;
--   drop trigger if exists prevent_security_event_retry_queue_update on public.security_event_retry_queue;
--   drop function if exists public.prevent_security_event_retry_mutation();
--   drop table if exists public.security_event_retry_attempts;
--   drop table if exists public.security_event_retry_queue;
--   drop index if exists security_session_events_idempotency_key_uidx;
--   alter table public.security_session_events drop column if exists idempotency_key;
