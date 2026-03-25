-- Company RBAC baseline (additive) for canonical companies runtime path.
-- Adds roles/permissions primitives, ties memberships to roles, and introduces invitation skeleton.

create extension if not exists "pgcrypto";

create table if not exists public.roles (
  key text primary key,
  display_name text not null,
  is_advanced boolean not null default false,
  created_at timestamptz not null default now(),
  check (char_length(trim(key)) > 0)
);

create table if not exists public.permissions (
  key text primary key,
  description text not null,
  created_at timestamptz not null default now(),
  check (char_length(trim(key)) > 0)
);

create table if not exists public.role_permissions (
  role_key text not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_key, permission_key)
);

create table if not exists public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invited_email text not null,
  role text not null references public.roles(key),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (position('@' in invited_email) > 1)
);

create unique index if not exists company_invitations_pending_unique_idx
  on public.company_invitations (company_id, lower(invited_email))
  where status = 'pending';

create index if not exists company_invitations_company_idx on public.company_invitations (company_id, created_at desc);

insert into public.roles (key, display_name, is_advanced)
values
  ('owner', 'Owner', false),
  ('staff', 'Staff', false),
  ('read_only', 'Read-only', false),
  ('accountant', 'Accountant', true),
  ('auditor', 'Auditor', true),
  ('payroll_only', 'Payroll only', true),
  ('sales_only', 'Sales only', true),
  ('integration_admin', 'Integration admin', true)
on conflict (key) do update
set display_name = excluded.display_name,
    is_advanced = excluded.is_advanced;

insert into public.permissions (key, description)
values
  ('company.settings.manage', 'Update company profile and operational settings'),
  ('company.members.read', 'List company members and their roles'),
  ('company.members.manage', 'Invite members and change member roles'),
  ('company.invitations.read', 'List pending company invitations'),
  ('company.invitations.manage', 'Create and revoke company invitations')
on conflict (key) do update
set description = excluded.description;

insert into public.role_permissions (role_key, permission_key)
values
  ('owner', 'company.settings.manage'),
  ('owner', 'company.members.read'),
  ('owner', 'company.members.manage'),
  ('owner', 'company.invitations.read'),
  ('owner', 'company.invitations.manage'),
  ('staff', 'company.members.read'),
  ('staff', 'company.invitations.read'),
  ('read_only', 'company.members.read'),
  ('read_only', 'company.invitations.read')
on conflict do nothing;

update public.company_memberships
set role = 'staff'
where role = 'member';

alter table public.company_memberships
  drop constraint if exists company_memberships_role_check;

alter table public.company_memberships
  add constraint company_memberships_role_check
  check (
    role in (
      'owner',
      'staff',
      'read_only',
      'accountant',
      'auditor',
      'payroll_only',
      'sales_only',
      'integration_admin'
    )
  );

alter table public.company_memberships
  add constraint company_memberships_role_fkey
  foreign key (role) references public.roles(key)
  on update cascade
  on delete restrict;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.company_invitations enable row level security;

drop policy if exists "Authenticated users read roles" on public.roles;
create policy "Authenticated users read roles" on public.roles
  for select to authenticated
  using (true);

drop policy if exists "Authenticated users read permissions" on public.permissions;
create policy "Authenticated users read permissions" on public.permissions
  for select to authenticated
  using (true);

drop policy if exists "Authenticated users read role permissions" on public.role_permissions;
create policy "Authenticated users read role permissions" on public.role_permissions
  for select to authenticated
  using (true);

drop policy if exists "Members read company invitations" on public.company_invitations;
create policy "Members read company invitations" on public.company_invitations
  for select to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_invitations.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Owners insert company invitations" on public.company_invitations;
create policy "Owners insert company invitations" on public.company_invitations
  for insert to authenticated
  with check (
    invited_by = auth.uid()
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_invitations.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

drop policy if exists "Owners update company invitations" on public.company_invitations;
create policy "Owners update company invitations" on public.company_invitations
  for update to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_invitations.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = company_invitations.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

drop trigger if exists set_company_invitations_updated_at on public.company_invitations;
create trigger set_company_invitations_updated_at
before update on public.company_invitations
for each row execute function public.set_updated_at();

grant select on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant select, insert, update on public.company_invitations to authenticated;

-- Rollback / recovery notes:
-- - This migration is additive but updates existing membership role values (`member` -> `staff`).
-- - Rollback SQL:
--   alter table public.company_memberships drop constraint if exists company_memberships_role_fkey;
--   alter table public.company_memberships drop constraint if exists company_memberships_role_check;
--   alter table public.company_memberships add constraint company_memberships_role_check check (role in ('owner','member'));
--   update public.company_memberships set role = 'member' where role = 'staff';
--   drop table if exists public.company_invitations;
--   drop table if exists public.role_permissions;
--   drop table if exists public.permissions;
--   drop table if exists public.roles;
-- - Recovery guidance:
--   1) Snapshot company_memberships and company_invitations before rollback.
--   2) Re-apply this migration and restore snapshots if rollback was accidental.
--   3) Re-validate owner/member permission boundaries in API + RLS.
