# Security Rules

Related docs: [System Overview](../architecture/SYSTEM_OVERVIEW.md), [API Contracts](../architecture/API_CONTRACTS.md), [Test Strategy](../testing/TEST_STRATEGY.md).

## Current auth model
- Supabase Auth (email/password) is used for user authentication.
- Middleware redirects unauthenticated users away from protected routes.
- Route handlers call `supabase.auth.getUser()` to enforce authenticated access.
- Session-management routes derive ownership from the authenticated Supabase context and never trust client-supplied user identifiers.

## Current role model
- Company-scoped RBAC baseline is implemented with `roles`, `permissions`, `role_permissions`, and `company_memberships.role`.
- Seeded baseline roles: `owner`, `staff`, `read_only`.
- Permission checks are enforced server-side in API handlers (not UI-only) for company settings/member/invitation actions.
- Advanced roles (`accountant`, `auditor`, `payroll_only`, `sales_only`, `integration_admin`) are present as feature-flagged placeholders until permission matrix finalization.

## Supabase security and RLS
- RLS enabled on key tables (`profiles`, `transactions`, `categories`, `receipts`, legacy tables).
- Policies constrain CRUD to `auth.uid()` ownership and same-company membership checks for company-scoped finance rows (`company_id`).
- Storage bucket policies restrict receipt object paths to per-user folder prefixes.

## Company isolation controls (current runtime)
- Active company is persisted in `profiles.active_company_id` and switched only through `POST /api/companies/switch` after membership validation.
- Company-scoped route handlers resolve active company server-side and do not trust client ownership or company context fields.
- Finance endpoints (`/api/transactions`, `/api/categories`, `/api/receipts`) enforce active membership + `company_id` scoping.
- Entitlement enforcement is server-side in `/api/transactions` and gated by rollout flags (`ENABLE_ENTITLEMENT_ENFORCEMENT`, `ENABLE_ENTITLEMENT_ENFORCEMENT_PLAN_KEYS`) to control plan-tier activation.
- CVR lookup endpoint is adapter-based and returns explicit `manual_entry_required` fallback when provider integration is unavailable.

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


## Session revocation controls (current runtime)
- `GET /api/me/sessions` scopes responses to sessions belonging to the authenticated user.
- `DELETE /api/me/sessions/{session_id}` enforces authenticated ownership checks before revocation.
- Revocation of the current active session is blocked to avoid unexpected lockout.
- Unauthorized or forbidden requests return minimal `401/403` responses without exposing whether another user session exists.

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
1. Expand and finalize advanced-role permission matrix before enabling advanced roles in production.
2. Add automated security tests for RLS and auth boundaries.
3. Add explicit data retention/deletion policy for receipts and accounting artifacts.
4. Replace session revoke audit hook placeholder with immutable persistent audit storage.
5. Add centralized audit event system.
6. Replace owner-only entitlement seed route with auditable admin workflow before production billing integration.
