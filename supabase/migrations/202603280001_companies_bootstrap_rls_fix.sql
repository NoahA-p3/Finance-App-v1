-- Fix onboarding bootstrap flow: allow company creators to read their newly created company
-- before membership row insertion completes.
--
-- Why:
-- - company_memberships insert policy checks company ownership via exists(...) on public.companies.
-- - the companies select policy previously required membership, which does not exist yet during bootstrap.
-- - this could cause first-company onboarding to fail with an RLS error.

alter table public.companies enable row level security;

drop policy if exists "Members view companies" on public.companies;
create policy "Members view companies" on public.companies
  for select to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
    )
  );

-- Rollback / recovery notes:
-- - Policy-only migration; no data shape changes.
-- - Rollback SQL:
--   drop policy if exists "Members view companies" on public.companies;
--   create policy "Members view companies" on public.companies
--     for select to authenticated
--     using (
--       exists (
--         select 1
--         from public.company_memberships cm
--         where cm.company_id = companies.id
--           and cm.user_id = auth.uid()
--       )
--     );
-- - Recovery guidance:
--   1) Re-apply this migration if onboarding bootstrap errors return.
--   2) Verify with an authenticated first-time user flow: companies insert -> owner membership insert -> settings insert.
