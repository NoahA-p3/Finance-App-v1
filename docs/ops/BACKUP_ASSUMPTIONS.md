# Backup Assumptions

**As of:** 2026-03-29.

This runbook records the current recovery assumptions for the MVP runtime path (`auth.users -> public.profiles -> company-scoped finance tables`).

## Scope
- Supabase Postgres data in the canonical runtime schema.
- Supabase Storage objects for private `receipts` bucket.
- Migration files under `supabase/migrations/*` used for forward re-application.

## Operational assumptions
1. **Platform backups exist:** Supabase-managed backups are configured and retained per environment policy.
2. **Storage must be included:** Receipt recovery is incomplete without the private `receipts` bucket objects.
3. **Schema replay source of truth:** Migration ordering is defined in `supabase/migrations/MIGRATION_ORDER.md` and must be treated as canonical for replay.
4. **Recovery is append-preserving:** For compliance-sensitive finance/audit tables, rollback and restore procedures must preserve traceability and avoid destructive ad-hoc edits.
5. **Access to tooling:** Recovery operator has credentials for both:
   - Supabase project operations,
   - SQL verification execution after restore.

## Required recovery artifacts per environment
Maintain the following artifacts for each environment (prod/staging/dev):
- Latest successful backup timestamp and backup identifier.
- Snapshot note for storage state (receipts bucket included).
- Current migration head identifier.
- Link to release notes describing the last migration batch.
- Contact/owner for restore authorization.

## Known gaps / TODO
- **TODO:** Record explicit backup cadence/RPO/RTO targets once defined in ops policy.
- **TODO:** Add automated alerting for backup failures and stale backup age thresholds.

## Related runbooks
- [Restore Procedure](./RESTORE_RUNBOOK.md)
- [Migration Rollback Sequence](./MIGRATION_ROLLBACK_SEQUENCE.md)
- [Post-Restore Verification](./POST_RESTORE_VERIFICATION.md)
- [Release Readiness Checklist](./RELEASE_READINESS_CHECKLIST.md)
