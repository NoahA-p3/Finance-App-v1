-- Internal billing foundation (provider-agnostic).
-- Adds plans/subscriptions/entitlements/usage counters and seeds baseline plan config.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  entitlement_key text not null,
  limit_value numeric(14,2),
  warning_threshold_percent smallint not null default 80,
  is_enforced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, entitlement_key),
  constraint plan_entitlements_warning_threshold_check
    check (warning_threshold_percent between 1 and 100)
);

create table if not exists public.company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active' check (status in ('active', 'trialing', 'paused', 'cancelled')),
  source text not null default 'internal_seed' check (source in ('internal_seed', 'internal_admin', 'billing_provider')),
  current_period_start date,
  current_period_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists company_subscriptions_active_company_idx
  on public.company_subscriptions (company_id)
  where status in ('active', 'trialing');

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entitlement_key text not null,
  period_start date not null,
  period_end date not null,
  usage_value numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, entitlement_key, period_start, period_end),
  constraint usage_counters_period_check check (period_end >= period_start)
);

create index if not exists usage_counters_company_entitlement_idx
  on public.usage_counters (company_id, entitlement_key, period_end desc);

-- Keep updated_at current.
drop trigger if exists set_plans_updated_at on public.plans;
create trigger set_plans_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

drop trigger if exists set_plan_entitlements_updated_at on public.plan_entitlements;
create trigger set_plan_entitlements_updated_at
before update on public.plan_entitlements
for each row execute function public.set_updated_at();

drop trigger if exists set_company_subscriptions_updated_at on public.company_subscriptions;
create trigger set_company_subscriptions_updated_at
before update on public.company_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_usage_counters_updated_at on public.usage_counters;
create trigger set_usage_counters_updated_at
before update on public.usage_counters
for each row execute function public.set_updated_at();

-- Seed baseline plans.
insert into public.plans (key, name)
values
  ('starter', 'Starter'),
  ('growth', 'Growth'),
  ('pro', 'Pro')
on conflict (key) do update set
  name = excluded.name,
  is_active = true,
  updated_at = now();

with seeded_plan_entitlements(plan_key, entitlement_key, limit_value, warning_threshold_percent, is_enforced) as (
  values
    ('starter', 'monthly_vouchers', 50::numeric, 80::smallint, true),
    ('starter', 'rolling_turnover_12m_dkk', 1000000::numeric, 90::smallint, true),
    ('growth', 'monthly_vouchers', 500::numeric, 80::smallint, true),
    ('growth', 'rolling_turnover_12m_dkk', 10000000::numeric, 90::smallint, true),
    ('pro', 'monthly_vouchers', null::numeric, 80::smallint, false),
    ('pro', 'rolling_turnover_12m_dkk', null::numeric, 90::smallint, false)
)
insert into public.plan_entitlements (plan_id, entitlement_key, limit_value, warning_threshold_percent, is_enforced)
select p.id, s.entitlement_key, s.limit_value, s.warning_threshold_percent, s.is_enforced
from seeded_plan_entitlements s
join public.plans p on p.key = s.plan_key
on conflict (plan_id, entitlement_key) do update set
  limit_value = excluded.limit_value,
  warning_threshold_percent = excluded.warning_threshold_percent,
  is_enforced = excluded.is_enforced,
  updated_at = now();

-- Ensure companies have internal default subscriptions.
insert into public.company_subscriptions (company_id, plan_id, status, source, current_period_start, current_period_end)
select c.id, p.id, 'active', 'internal_seed', current_date, (current_date + interval '1 month')::date
from public.companies c
join public.plans p on p.key = 'starter'
where not exists (
  select 1
  from public.company_subscriptions cs
  where cs.company_id = c.id
    and cs.status in ('active', 'trialing')
);

alter table public.plans enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.company_subscriptions enable row level security;
alter table public.usage_counters enable row level security;

drop policy if exists "Members read plans" on public.plans;
create policy "Members read plans" on public.plans
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members read plan entitlements" on public.plan_entitlements;
create policy "Members read plan entitlements" on public.plan_entitlements
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      join public.company_subscriptions cs
        on cs.company_id = cm.company_id
      where cm.user_id = auth.uid()
        and cs.plan_id = plan_entitlements.plan_id
        and cs.status in ('active', 'trialing')
    )
  );

drop policy if exists "Members read own company subscriptions" on public.company_subscriptions;
create policy "Members read own company subscriptions" on public.company_subscriptions
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_subscriptions.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members read own company usage counters" on public.usage_counters;
create policy "Members read own company usage counters" on public.usage_counters
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = usage_counters.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Owners manage own company usage counters" on public.usage_counters;
create policy "Owners manage own company usage counters" on public.usage_counters
  for all to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = usage_counters.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = usage_counters.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

grant select on public.plans to authenticated;
grant select on public.plan_entitlements to authenticated;
grant select on public.company_subscriptions to authenticated;
grant select, insert, update on public.usage_counters to authenticated;

-- Rollback / recovery notes:
-- - Rollback SQL (destructive to billing state and usage history):
--   drop table if exists public.usage_counters;
--   drop table if exists public.company_subscriptions;
--   drop table if exists public.plan_entitlements;
--   drop table if exists public.plans;
-- - Recovery guidance:
--   1) Snapshot plans, plan_entitlements, company_subscriptions, usage_counters before rollback.
--   2) Re-apply migration and restore snapshots if rollback was accidental.
--   3) Re-check same-company RLS visibility and ownership constraints.
