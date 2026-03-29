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

## Backup policy baseline (MVP)

> This is the minimum policy baseline for current operations. Update these values if platform settings or contractual requirements change.

- **Backup cadence:**
  - **Database (Supabase managed):** daily automated snapshot.
  - **Storage (`receipts` bucket):** daily backup/export aligned to database snapshot window.
  - **Change-window guidance:** for migration releases, verify the most recent successful backup timestamp before applying migrations.
- **Retention period:**
  - **Database snapshots:** 30 days minimum retention.
  - **Storage backups/exports:** 30 days minimum retention.
  - Keep at least one known-good backup from the prior release cycle.
- **Target RPO/RTO:**
  - **Target RPO:** <= 24 hours.
  - **Target RTO:** <= 8 hours from restore authorization to verified recovery completion.
  - If either target is not met during an incident or rehearsal, document gap and mitigation in release notes.
- **Ownership / escalation:**
  - **Primary owner:** Engineering on-call for the affected environment.
  - **Secondary owner:** Release manager for the active release window.
  - **Escalation path:** Engineering on-call -> Release manager -> Security reviewer (if security/finance data integrity is impacted).
  - Record owner handoff timestamps in incident/rehearsal logs.

## Known gaps / TODO
- **TODO:** Add automated alerting for backup failures and stale backup age thresholds.

## Related runbooks
- [Restore Procedure](./RESTORE_RUNBOOK.md)
- [Migration Rollback Sequence](./MIGRATION_ROLLBACK_SEQUENCE.md)
- [Post-Restore Verification](./POST_RESTORE_VERIFICATION.md)
- [Release Readiness Checklist](./RELEASE_READINESS_CHECKLIST.md)
