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
