# Restore Procedure

**As of:** 2026-03-29.

Use this runbook after a restore-worthy incident (data corruption, failed destructive migration, or environment recovery).

## Preconditions
- Incident scope documented (affected environment and expected recovery point).
- Restore authorization approved by environment owner.
- Backup target selected (timestamp + backup identifier).
- Operator has access to Supabase project and SQL execution context.

## Procedure
1. **Freeze writes (if applicable).**
   - Pause deployments and disable write-heavy jobs/workers for the affected environment.
   - Announce maintenance window.

2. **Capture pre-restore state for forensics.**
   - Export current schema and migration head.
   - Record key table row counts (`transactions`, `receipts`, `journal_entries`, `audit_events`).

3. **Restore database backup.**
   - Use Supabase platform restore controls for the selected backup.
   - Confirm restore completion status before applying any SQL operations.

4. **Restore storage objects (receipts bucket) if backup model requires separate restore.**
   - Ensure private `receipts` objects are restored for the same recovery window.

5. **Reconcile migration head.**
   - Compare restored schema state with repository migration head from `supabase/migrations/MIGRATION_ORDER.md`.
   - If two migrations share the same timestamp prefix (for example, `202603290001_*`), apply/replay in lexicographic **full-filename** order from the runbook.
   - If drift exists, apply only required forward migrations in canonical order:

   ```bash
   supabase db push
   ```

6. **Run rollback/recovery SQL only if migration reconciliation failed.**
   - Follow [Migration Rollback Sequence](./MIGRATION_ROLLBACK_SEQUENCE.md) in strict reverse-application order.

7. **Execute post-restore validation suite.**
   - Run every check in [Post-Restore Verification](./POST_RESTORE_VERIFICATION.md) before reopening write traffic.

8. **Reopen traffic and monitor.**
   - Re-enable writes.
   - Monitor auth, finance write endpoints, and receipt upload/download behavior.

## Exit criteria
- Migration state matches expected repository order.
- Post-restore verification checks pass (RLS, trigger immutability, receipt storage access).
- Incident log contains restore timestamp, operator, backup ID, and verification results.

## Lightweight rehearsal log template
Use this template for restore drills and migration-release rehearsals.

| Date (UTC) | Operator | Result (Pass/Fail) | Issues / Notes |
| --- | --- | --- | --- |
| YYYY-MM-DD | <name> | Pass \| Fail | <summary of blockers, follow-ups, ticket links> |

Store completed entries in release notes and/or incident timeline docs for audit traceability.

## Related runbooks
- [Backup Assumptions](./BACKUP_ASSUMPTIONS.md)
- [Migration Rollback Sequence](./MIGRATION_ROLLBACK_SEQUENCE.md)
- [Post-Restore Verification](./POST_RESTORE_VERIFICATION.md)
- [Release Readiness Checklist](./RELEASE_READINESS_CHECKLIST.md)
