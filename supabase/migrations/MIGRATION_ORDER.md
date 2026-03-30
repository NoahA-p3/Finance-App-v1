# Supabase Migration Order (Canonical)

**As of:** 2026-03-30.

This runbook documents the intended execution sequence for SQL files in `supabase/migrations/` and the dependency edges where order materially affects success.

## Canonical run order

Run files in lexicographic order by **full filename** (not only timestamp prefix).

> Ordering rule for equal timestamp prefixes (for example, `202603290001_*`): sort by the complete filename in ascending lexicographic order.

1. `202603200001_init.sql`
2. `202603200002_auth_profiles.sql`
3. `202603200003_auth_profile_signup_fields.sql`
4. `202603200004_finance_assistant_mvp.sql` *(legacy branch artifact; kept for historical compatibility)*
5. `202603210001_profiles_schema_hardening.sql`
6. `202603230001_legacy_schema_inventory.sql`
7. `202603250001_companies_bootstrap.sql`
8. `202603250002_company_rbac_baseline.sql`
9. `202603250003_active_company_and_company_scoped_finance.sql`
10. `202603250004_internal_billing_entitlements.sql`
11. `202603270001_company_shared_finance_rls.sql`
12. `202603270002_posting_and_audit_immutability.sql`
13. `202603270003_finance_write_permissions_and_rls_alignment.sql`
14. `202603280001_companies_bootstrap_rls_fix.sql`
15. `202603290001_company_invitation_acceptance_flow.sql`
16. `202603290001_security_session_events.sql`
17. `202603290002_categories_write_permissions_alignment.sql`
18. `202603290003_security_event_retry_queue.sql`
19. `202603300001_integration_connections.sql`
20. `202603300001_transactions_notes_column.sql`

## Sequence-sensitive dependency checkpoints

### A) Auth/profile foundation before company-scoped features
- `202603200002_auth_profiles.sql` and `202603200003_auth_profile_signup_fields.sql` must run before migrations that rely on `public.profiles` metadata and profile trigger behavior.

### B) Company schema before company-scoped finance
- `202603250001_companies_bootstrap.sql` must precede:
  - `202603250002_company_rbac_baseline.sql` (roles/permissions/invitations depend on memberships),
  - `202603250003_active_company_and_company_scoped_finance.sql` (`company_id` FKs + profile `active_company_id`),
  - `202603250004_internal_billing_entitlements.sql` (subscriptions and usage depend on companies),
  - `202603270002_posting_and_audit_immutability.sql` (posting tables reference companies),
  - `202603270003_finance_write_permissions_and_rls_alignment.sql` (permission seeds + policy joins).

### C) RBAC baseline before finance permission alignment
- `202603250002_company_rbac_baseline.sql` must run before `202603270003_finance_write_permissions_and_rls_alignment.sql`, because `202603270003` inserts into and joins `public.permissions` + `public.role_permissions`.

### D) Posting/audit tables before posting permission policy split
- `202603270002_posting_and_audit_immutability.sql` must run before `202603270003_finance_write_permissions_and_rls_alignment.sql`, because `202603270003` replaces policies on `period_locks`, `journal_entries`, `journal_lines`, and `audit_events` created in `202603270002`.


### E) User-scoped session security audit after auth foundation
- `202603290001_security_session_events.sql` depends on `auth.users` and should run after core auth/profile migrations.
- It is independent from company-scoped posting `audit_events`; no company foreign key is required.

### F) Session retry queue after base security session events
- `202603290003_security_event_retry_queue.sql` depends on `202603290001_security_session_events.sql` because it adds `idempotency_key` constraints and replay tables referencing `public.security_session_events`.

### G) Same-prefix migration pair ordering (`202603290001_*`)
- `202603290001_company_invitation_acceptance_flow.sql` and `202603290001_security_session_events.sql` intentionally share the same timestamp prefix.
- Apply in full-filename lexicographic order:
  1. `202603290001_company_invitation_acceptance_flow.sql`
  2. `202603290001_security_session_events.sql`


### H) Integrations baseline after company bootstrap
- `202603300001_integration_connections.sql` depends on company/membership tables and `public.set_updated_at()` from `202603250001_companies_bootstrap.sql`.
- It is independent of posting and entitlement flows, but must run after company schema bootstrap and RBAC baseline so API permission checks map cleanly.

## Legacy branch handling note

`202603200004_finance_assistant_mvp.sql` includes divergent legacy artifacts (`public.users`, `public.accounts`, alternate finance column shape). It remains in historical sequence, but new runtime features should target the canonical path described in `README.md` and `supabase/migrations/README_SCHEMA_GUARDRAILS.md`.

## Recommended execution command

```bash
supabase db push
```

For drift debugging or manual replay, keep ordering identical to this file.

Operational runbooks:
- [`docs/ops/BACKUP_ASSUMPTIONS.md`](../../docs/ops/BACKUP_ASSUMPTIONS.md)
- [`docs/ops/RESTORE_RUNBOOK.md`](../../docs/ops/RESTORE_RUNBOOK.md)
- [`docs/ops/MIGRATION_ROLLBACK_SEQUENCE.md`](../../docs/ops/MIGRATION_ROLLBACK_SEQUENCE.md)
- [`docs/ops/POST_RESTORE_VERIFICATION.md`](../../docs/ops/POST_RESTORE_VERIFICATION.md)
- [`docs/ops/RELEASE_READINESS_CHECKLIST.md`](../../docs/ops/RELEASE_READINESS_CHECKLIST.md)

## Recovery / rollback operations

Each migration SQL file should be treated as the source for rollback notes/recovery guidance. When rolling back sequence-sensitive migrations:
1. Snapshot affected tables first.
2. Roll back in reverse order of application.
3. Re-verify RLS behavior and policy coverage for company isolation and finance write permissions.
4. Execute the concrete post-restore checks in [`docs/ops/POST_RESTORE_VERIFICATION.md`](../../docs/ops/POST_RESTORE_VERIFICATION.md).

## Release-readiness requirement

When a release includes migrations that touch security or finance tables/policies, reviewers must complete and record the runbook review checklist in [`docs/ops/RELEASE_READINESS_CHECKLIST.md`](../../docs/ops/RELEASE_READINESS_CHECKLIST.md) before promotion.
