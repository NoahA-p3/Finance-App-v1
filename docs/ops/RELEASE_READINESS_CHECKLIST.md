# Release Readiness Checklist

**As of:** 2026-03-29.

Use this checklist before promoting a migration-containing release.

## Mandatory checks
- [ ] Migration list and order reviewed against `supabase/migrations/MIGRATION_ORDER.md`.
- [ ] Recovery runbooks reviewed:
  - [ ] `docs/ops/BACKUP_ASSUMPTIONS.md`
  - [ ] `docs/ops/RESTORE_RUNBOOK.md`
  - [ ] `docs/ops/MIGRATION_ROLLBACK_SEQUENCE.md`
  - [ ] `docs/ops/POST_RESTORE_VERIFICATION.md`
- [ ] Rollback owner assigned for release window.
- [ ] Post-restore verification owner assigned.

## Conditional requirement (security/finance migrations)
If any migration in the release touches security-sensitive or finance tables/policies (including RLS, triggers, audit, receipts, transactions, postings, memberships, roles/permissions), runbook review is **required** and must be recorded in release notes.

Required release note fields:
- [ ] Tables/policies touched.
- [ ] Why runbook review is sufficient for rollback/restore risk.
- [ ] Which operator validated post-restore SQL checks in rehearsal (or explicit TODO if rehearsal is pending).

## Verification execution
- [ ] Lint/type checks completed.
- [ ] Build check completed when schema/API behavior changed.
- [ ] Security notes include RLS and storage policy impact.
- [ ] Migration notes include rollback or recovery guidance.

## Sign-off
- [ ] Engineering owner sign-off.
- [ ] Security reviewer sign-off (required when security/finance surfaces changed).
- [ ] Release manager sign-off.
