-- Align categories mutations with role-based finance write permissions.
-- read_only remains read-capable but cannot create/update/delete categories.

insert into public.permissions (key, description)
values
  ('finance.categories.write', 'Create and mutate company categories')
on conflict (key) do update
set description = excluded.description;

insert into public.role_permissions (role_key, permission_key)
values
  ('owner', 'finance.categories.write'),
  ('staff', 'finance.categories.write')
on conflict do nothing;

drop policy if exists "Members manage company categories" on public.categories;
drop policy if exists "Members read company categories" on public.categories;
create policy "Members read company categories" on public.categories
  for select to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members mutate company categories" on public.categories;
create policy "Members mutate company categories" on public.categories
  for insert to authenticated
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.categories.write'
    )
  );

drop policy if exists "Members update company categories" on public.categories;
create policy "Members update company categories" on public.categories
  for update to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.categories.write'
    )
  )
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.categories.write'
    )
  );

drop policy if exists "Members delete company categories" on public.categories;
create policy "Members delete company categories" on public.categories
  for delete to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.categories.write'
    )
  );

-- Rollback / recovery notes:
-- Snapshot before rollback:
--   create table if not exists public._snapshot_202603290002_categories_policies as
--     select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--     from pg_policies
--     where schemaname = 'public' and tablename = 'categories';
--   create table if not exists public._snapshot_202603290002_permissions as
--     select key, description from public.permissions where key = 'finance.categories.write';
--   create table if not exists public._snapshot_202603290002_role_permissions as
--     select role_key, permission_key from public.role_permissions where permission_key = 'finance.categories.write';
-- Recovery rollback:
--   drop policy if exists "Members mutate company categories" on public.categories;
--   drop policy if exists "Members update company categories" on public.categories;
--   drop policy if exists "Members delete company categories" on public.categories;
--   drop policy if exists "Members read company categories" on public.categories;
--   create policy "Members manage company categories" on public.categories
--     for all to authenticated
--     using (
--       company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = categories.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = categories.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   delete from public.role_permissions where permission_key = 'finance.categories.write';
--   delete from public.permissions where key = 'finance.categories.write';
-- Re-verify after rollback or restore:
--   select key from public.permissions where key = 'finance.categories.write';
--   select role_key, permission_key from public.role_permissions where permission_key = 'finance.categories.write' order by role_key;
--   select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'categories' order by policyname;

