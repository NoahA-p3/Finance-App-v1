# Post-Restore Verification

**As of:** 2026-03-29.

Run this full checklist after database/storage restore and before reopening write traffic.

## 1) Migration/state sanity
- Confirm migration order document matches the intended head.
- Confirm critical tables exist: `profiles`, `company_memberships`, `transactions`, `categories`, `receipts`, `journal_entries`, `journal_lines`, `period_locks`, `audit_events`.

## 2) RLS verification checks (concrete)

### 2.1 Ensure RLS is enabled on core tables
```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'transactions',
    'categories',
    'receipts',
    'company_memberships',
    'journal_entries',
    'journal_lines',
    'period_locks',
    'audit_events',
    'security_session_events'
  )
order by tablename;
```
Expected: `rowsecurity = true` for each listed table.

### 2.2 Ensure key RLS policies are present
```sql
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in (
    'transactions',
    'categories',
    'receipts',
    'journal_entries',
    'journal_lines',
    'period_locks',
    'audit_events',
    'security_session_events'
  )
order by tablename, policyname;
```
Expected: policy rows exist for every listed table; no table should return empty policy coverage.

## 3) Posting/audit immutability trigger checks (concrete)

### 3.1 Confirm trigger definitions exist
```sql
select event_object_table as table_name, trigger_name
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('journal_entries', 'journal_lines', 'audit_events', 'security_session_events')
order by event_object_table, trigger_name;
```
Expected: append-only protection triggers are present for audit/posting security tables.

### 3.2 Negative test: update/delete should fail
Use a transaction and roll back so no test residue is kept.

```sql
begin;

-- Replace <known_audit_event_id> with a real row ID from public.audit_events.
update public.audit_events
set event_type = event_type
where id = '<known_audit_event_id>';

rollback;
```

```sql
begin;

-- Replace <known_audit_event_id> with a real row ID from public.audit_events.
delete from public.audit_events
where id = '<known_audit_event_id>';

rollback;
```
Expected: update and delete statements are blocked by immutability triggers.

## 4) Receipt storage access checks after restore (concrete)

### 4.1 Confirm bucket metadata exists
```sql
select id, name, public
from storage.buckets
where id = 'receipts';
```
Expected: one row for `receipts` with non-public/private access configuration.

### 4.2 Confirm storage policies exist for receipts objects
```sql
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname ilike '%receipt%';
```
Expected: receipt-related object policies are present.

### 4.3 Runtime access smoke checks
- Authenticated user with valid company membership can upload/download own receipt path (`user_id/company_id/<uuid>.<ext>`).
- Different authenticated user without matching path entitlement cannot read/write another user's receipt objects.

## 5) API smoke checks
- `POST /api/transactions` with valid authenticated context succeeds for write-enabled roles.
- `POST /api/transactions` and `POST /api/receipts` fail for `read_only` membership.
- Posting reverse/period lock flows still emit audit events.

## Sign-off template
Record results with:
- Restore timestamp (UTC)
- Environment
- Operator
- Backup ID
- Migration head after reconciliation
- RLS checks: pass/fail
- Immutability checks: pass/fail
- Receipt storage checks: pass/fail
- Follow-up actions

## Lightweight rehearsal log template
Use this quick log for post-restore verification rehearsals tied to migration releases.

| Date (UTC) | Operator | Result (Pass/Fail) | Issues / Notes |
| --- | --- | --- | --- |
| YYYY-MM-DD | <name> | Pass \| Fail | <failed checks, remediation owner, due date> |
