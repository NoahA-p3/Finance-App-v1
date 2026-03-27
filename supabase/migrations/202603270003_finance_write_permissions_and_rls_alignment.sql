-- Finance write permissions + RLS alignment for company-scoped finance mutations.
-- Adds explicit permission seeds and ensures DB-level authorization mirrors API intent.

insert into public.permissions (key, description)
values
  ('finance.transactions.write', 'Create and mutate company transactions'),
  ('finance.receipts.write', 'Upload and mutate company receipt metadata'),
  ('finance.postings.write', 'Create and reverse journal postings'),
  ('finance.period_locks.manage', 'Create and manage accounting period locks')
on conflict (key) do update
set description = excluded.description;

insert into public.role_permissions (role_key, permission_key)
values
  ('owner', 'finance.transactions.write'),
  ('owner', 'finance.receipts.write'),
  ('owner', 'finance.postings.write'),
  ('owner', 'finance.period_locks.manage'),
  ('staff', 'finance.transactions.write'),
  ('staff', 'finance.receipts.write'),
  ('staff', 'finance.postings.write'),
  ('staff', 'finance.period_locks.manage')
on conflict do nothing;

-- Transactions: allow all members to read, only permissioned members to mutate.
drop policy if exists "Members manage company transactions" on public.transactions;
drop policy if exists "Members read company transactions" on public.transactions;
create policy "Members read company transactions" on public.transactions
  for select to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members mutate company transactions" on public.transactions;
create policy "Members mutate company transactions" on public.transactions
  for insert to authenticated
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.transactions.write'
    )
  );

drop policy if exists "Members update company transactions" on public.transactions;
create policy "Members update company transactions" on public.transactions
  for update to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.transactions.write'
    )
  )
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.transactions.write'
    )
  );

drop policy if exists "Members delete company transactions" on public.transactions;
create policy "Members delete company transactions" on public.transactions
  for delete to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.transactions.write'
    )
  );

-- Receipts: allow all members to read, only permissioned members to mutate.
drop policy if exists "Members manage company receipts" on public.receipts;
drop policy if exists "Members read company receipts" on public.receipts;
create policy "Members read company receipts" on public.receipts
  for select to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members mutate company receipts" on public.receipts;
create policy "Members mutate company receipts" on public.receipts
  for insert to authenticated
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.receipts.write'
    )
  );

drop policy if exists "Members update company receipts" on public.receipts;
create policy "Members update company receipts" on public.receipts
  for update to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.receipts.write'
    )
  )
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.receipts.write'
    )
  );

drop policy if exists "Members delete company receipts" on public.receipts;
create policy "Members delete company receipts" on public.receipts
  for delete to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.receipts.write'
    )
  );

-- Journal entries + lines: read for all members, mutate for finance.postings.write.
drop policy if exists "Members manage journal entries" on public.journal_entries;
drop policy if exists "Members read journal entries" on public.journal_entries;
create policy "Members read journal entries" on public.journal_entries
  for select to authenticated
  using (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = journal_entries.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members mutate journal entries" on public.journal_entries;
create policy "Members mutate journal entries" on public.journal_entries
  for all to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = journal_entries.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.postings.write'
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = journal_entries.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.postings.write'
    )
  );

drop policy if exists "Members manage journal lines" on public.journal_lines;
drop policy if exists "Members read journal lines" on public.journal_lines;
create policy "Members read journal lines" on public.journal_lines
  for select to authenticated
  using (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = journal_lines.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members mutate journal lines" on public.journal_lines;
create policy "Members mutate journal lines" on public.journal_lines
  for all to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = journal_lines.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.postings.write'
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = journal_lines.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.postings.write'
    )
  );

-- Period locks: read for all members, mutate for finance.period_locks.manage.
drop policy if exists "Members manage period locks" on public.period_locks;
drop policy if exists "Members read period locks" on public.period_locks;
create policy "Members read period locks" on public.period_locks
  for select to authenticated
  using (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = period_locks.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members mutate period locks" on public.period_locks;
create policy "Members mutate period locks" on public.period_locks
  for all to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = period_locks.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.period_locks.manage'
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = period_locks.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.period_locks.manage'
    )
  );

-- Audit events: read for all members, insert for finance.postings.write.
drop policy if exists "Members insert and view audit events" on public.audit_events;
drop policy if exists "Members read audit events" on public.audit_events;
create policy "Members read audit events" on public.audit_events
  for select to authenticated
  using (
    exists (
      select 1 from public.company_memberships cm
      where cm.company_id = audit_events.company_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Members insert audit events" on public.audit_events;
create policy "Members insert audit events" on public.audit_events
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.company_memberships cm
      join public.role_permissions rp on rp.role_key = cm.role
      where cm.company_id = audit_events.company_id
        and cm.user_id = auth.uid()
        and rp.permission_key = 'finance.postings.write'
    )
  );

-- Rollback / recovery notes:
-- - This migration updates seed permissions and replaces RLS policies only; no table rows are modified directly.
-- - Rollback SQL:
--   drop policy if exists "Members insert audit events" on public.audit_events;
--   drop policy if exists "Members read audit events" on public.audit_events;
--   create policy "Members insert and view audit events" on public.audit_events
--     for all to authenticated
--     using (
--       exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = audit_events.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = audit_events.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   drop policy if exists "Members mutate period locks" on public.period_locks;
--   drop policy if exists "Members read period locks" on public.period_locks;
--   create policy "Members manage period locks" on public.period_locks
--     for all to authenticated
--     using (
--       exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = period_locks.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = period_locks.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   drop policy if exists "Members mutate journal lines" on public.journal_lines;
--   drop policy if exists "Members read journal lines" on public.journal_lines;
--   create policy "Members manage journal lines" on public.journal_lines
--     for all to authenticated
--     using (
--       exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = journal_lines.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = journal_lines.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   drop policy if exists "Members mutate journal entries" on public.journal_entries;
--   drop policy if exists "Members read journal entries" on public.journal_entries;
--   create policy "Members manage journal entries" on public.journal_entries
--     for all to authenticated
--     using (
--       exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = journal_entries.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = journal_entries.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   drop policy if exists "Members delete company receipts" on public.receipts;
--   drop policy if exists "Members update company receipts" on public.receipts;
--   drop policy if exists "Members mutate company receipts" on public.receipts;
--   drop policy if exists "Members read company receipts" on public.receipts;
--   create policy "Members manage company receipts" on public.receipts
--     for all to authenticated
--     using (
--       company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = receipts.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = receipts.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   drop policy if exists "Members delete company transactions" on public.transactions;
--   drop policy if exists "Members update company transactions" on public.transactions;
--   drop policy if exists "Members mutate company transactions" on public.transactions;
--   drop policy if exists "Members read company transactions" on public.transactions;
--   create policy "Members manage company transactions" on public.transactions
--     for all to authenticated
--     using (
--       company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = transactions.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = transactions.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   delete from public.role_permissions
--   where permission_key in ('finance.transactions.write', 'finance.receipts.write', 'finance.postings.write', 'finance.period_locks.manage')
--     and role_key in ('owner', 'staff');
--   delete from public.permissions
--   where key in ('finance.transactions.write', 'finance.receipts.write', 'finance.postings.write', 'finance.period_locks.manage');
-- - Recovery guidance:
--   1) Validate owner/staff write and read_only write-deny behavior via API after migration.
--   2) If rollback is applied, re-verify posting/period-lock mutation access before reopening writes.
