# Migration Rollback Sequence

**As of:** 2026-03-29.

This runbook defines rollback execution order when migration-level recovery is required.

## Principles
- Roll back in **reverse application order**.
- Snapshot affected data before any rollback SQL.
- Prefer forward-fix migrations where possible; use rollback only for incident recovery.
- After rollback, always run [Post-Restore Verification](./POST_RESTORE_VERIFICATION.md).

## Rollback steps
1. Identify the failing migration file and all later-applied migrations.
2. Freeze writes to reduce concurrent drift.
3. Snapshot impacted tables and policy definitions.
4. Execute rollback SQL in reverse order of applied migrations.
5. Re-apply known-good migrations in canonical order from `supabase/migrations/MIGRATION_ORDER.md`.
6. Run post-restore verification checks before enabling writes.

## Reverse sequence (current canonical head)
If rolling back from current head (`202603290001_security_session_events.sql`), use this order:
1. `202603290001_security_session_events.sql`
2. `202603280001_companies_bootstrap_rls_fix.sql`
3. `202603270003_finance_write_permissions_and_rls_alignment.sql`
4. `202603270002_posting_and_audit_immutability.sql`
5. `202603270001_company_shared_finance_rls.sql`
6. `202603250004_internal_billing_entitlements.sql`
7. `202603250003_active_company_and_company_scoped_finance.sql`
8. `202603250002_company_rbac_baseline.sql`
9. `202603250001_companies_bootstrap.sql`
10. `202603230001_legacy_schema_inventory.sql`
11. `202603210001_profiles_schema_hardening.sql`
12. `202603200004_finance_assistant_mvp.sql` *(legacy artifact; rollback only if part of incident scope)*
13. `202603200003_auth_profile_signup_fields.sql`
14. `202603200002_auth_profiles.sql`
15. `202603200001_init.sql`

## Recovery notes for security/finance migrations
When the incident involves these migrations, include extra review notes in the incident log:
- `202603270002_posting_and_audit_immutability.sql` (append-only triggers on audit/posting tables).
- `202603270003_finance_write_permissions_and_rls_alignment.sql` (RLS + role-permission policy behavior).
- `202603290001_security_session_events.sql` (user-scoped RLS + append-only session-security events).

## Verification requirement
Rollback is incomplete until all checks in [Post-Restore Verification](./POST_RESTORE_VERIFICATION.md) pass.
