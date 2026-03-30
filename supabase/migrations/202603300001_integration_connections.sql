-- Integration connections baseline (additive).
-- Creates a company-scoped persisted model for Settings > Integrations backend-first rollout.

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider_key text not null,
  display_name text,
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  config jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_error_message text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider_key)
);

create index if not exists integration_connections_company_idx
  on public.integration_connections (company_id, updated_at desc);

drop trigger if exists set_integration_connections_updated_at on public.integration_connections;
create trigger set_integration_connections_updated_at
before update on public.integration_connections
for each row execute function public.set_updated_at();

alter table public.integration_connections enable row level security;

drop policy if exists "Members view integration connections" on public.integration_connections;
create policy "Members view integration connections" on public.integration_connections
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = integration_connections.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members manage own integration connections" on public.integration_connections;
create policy "Members manage own integration connections" on public.integration_connections
  for all to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = integration_connections.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = integration_connections.company_id
        and cm.user_id = auth.uid()
    )
  );

grant select, insert, update on public.integration_connections to authenticated;

-- Rollback / recovery notes:
-- 1) Snapshot existing rows before rollback:
--      create table if not exists public._integration_connections_backup_202603300001 as
--      select * from public.integration_connections;
-- 2) Remove policies/table if rollback is required:
--      drop policy if exists "Members view integration connections" on public.integration_connections;
--      drop policy if exists "Members manage own integration connections" on public.integration_connections;
--      drop table if exists public.integration_connections;
-- 3) Re-verify cleanup:
--      select to_regclass('public.integration_connections') as integration_connections_exists;
