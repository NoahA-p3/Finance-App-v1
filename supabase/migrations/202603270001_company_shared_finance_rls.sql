-- Canonical company-shared ownership policy for finance entities.
-- Scope: public.transactions, public.categories, public.receipts.
-- Authorization shifts to active membership + company_id (not user_id = auth.uid()).

-- Categories: shared within company membership context.
drop policy if exists "Users manage own categories" on public.categories;
create policy "Members manage company categories" on public.categories
  for all to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
    )
  );

-- Receipts: metadata rows are shared within company membership context.
drop policy if exists "Users manage own receipts" on public.receipts;
create policy "Members manage company receipts" on public.receipts
  for all to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = receipts.company_id
        and cm.user_id = auth.uid()
    )
  );

-- Transactions: shared within company membership context.
drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Members manage company transactions" on public.transactions
  for all to authenticated
  using (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    company_id is not null
    and exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
    )
  );

-- Rollback / recovery notes:
-- - This migration only replaces RLS policies; no table data is mutated.
-- - Rollback SQL:
--   drop policy if exists "Members manage company categories" on public.categories;
--   drop policy if exists "Members manage company receipts" on public.receipts;
--   drop policy if exists "Members manage company transactions" on public.transactions;
--   create policy "Users manage own categories" on public.categories
--     for all to authenticated
--     using (
--       user_id = auth.uid()
--       and company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = categories.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       user_id = auth.uid()
--       and company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = categories.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   create policy "Users manage own receipts" on public.receipts
--     for all to authenticated
--     using (
--       user_id = auth.uid()
--       and company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = receipts.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       user_id = auth.uid()
--       and company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = receipts.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
--   create policy "Users manage own transactions" on public.transactions
--     for all to authenticated
--     using (
--       user_id = auth.uid()
--       and company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = transactions.company_id
--           and cm.user_id = auth.uid()
--       )
--     )
--     with check (
--       user_id = auth.uid()
--       and company_id is not null
--       and exists (
--         select 1 from public.company_memberships cm
--         where cm.company_id = transactions.company_id
--           and cm.user_id = auth.uid()
--       )
--     );
-- - Recovery guidance:
--   1) Re-verify same-company cross-user access and cross-company denial after rollback/reapply.
--   2) Confirm API filters still align with whichever ownership model is active.
