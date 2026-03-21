# Security Rules

Related docs: [System Overview](../architecture/SYSTEM_OVERVIEW.md), [API Contracts](../architecture/API_CONTRACTS.md), [Test Strategy](../testing/TEST_STRATEGY.md).

## Current auth model
- Supabase Auth (email/password) is used for user authentication.
- Middleware redirects unauthenticated users away from protected routes.
- Route handlers call `supabase.auth.getUser()` to enforce authenticated access.

## Current role model
- Effectively single role: authenticated end user.
- Authorization is owner-based via `user_id` and RLS policies.
- No explicit admin/accountant/team roles implemented.

## Supabase security and RLS
- RLS enabled on key tables (`profiles`, `transactions`, `categories`, `receipts`, legacy tables).
- Policies constrain CRUD to `auth.uid()` ownership.
- Storage bucket policies restrict receipt object paths to per-user folder prefixes.

## Sensitive data classification
- High sensitivity:
  - PII: name, email, phone.
  - Financial records: transactions, receipts.
  - Tax/VAT-related data (planned expansion).
- Medium sensitivity:
  - category labels and derived analytics.

## PII handling rules
- Only collect minimum fields needed for product workflows.
- Avoid logging raw PII in server/client logs.
- Profile edits should verify authenticated identity before write (currently done in account menu flow).

## Bank and tax data handling rules
- Treat bank feeds and tax outputs as high-sensitivity data.
- Any future bank integration must use least-privilege access and explicit secret management.
- VAT/tax computation changes require tests and review notes.

## Logging and redaction rules
- Do not log secrets, raw auth tokens, full receipt URLs, or full personal identifiers.
- Error responses should avoid leaking internals.
- **TODO:** centralize structured logging policy once logging stack is introduced.

## Audit log expectations (target)
- Add immutable audit events for sensitive actions:
  - auth profile changes,
  - transaction post/reversal,
  - period close/open,
  - permission changes.
- Current codebase lacks dedicated audit log table.

## Secret handling expectations
- Use environment variables only; never commit secrets.
- Required vars currently documented in `.env.example`.
- Service role key should be server-only if used; avoid client exposure.

## Backup and recovery notes
- **Assumption:** Supabase managed backups apply at platform level.
- **TODO:** document restore runbook and migration rollback/recovery process in ops docs.

## Security gaps / TODOs
1. Add formal role model for multi-user businesses.
2. Add automated security tests for RLS and auth boundaries.
3. Add explicit data retention/deletion policy for receipts and accounting artifacts.
4. Add centralized audit event system.
