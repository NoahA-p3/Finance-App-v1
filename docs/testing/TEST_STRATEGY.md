# Test Strategy

Related docs: [Golden Datasets](./GOLDEN_DATASETS.md), [Security Rules](../security/SECURITY_RULES.md), [DK VAT Rules](../domain/DK_VAT_RULES.md).

**Last verified:** 2026-03-29.

## Last-verified policy
- This date records when this testing guidance was last checked against real repository scripts/tests.
- Update it whenever test commands or coverage claims in this file are changed or re-validated.

## Current test setup (observed)
Current executable commands in `package.json`:
- `npm run test` -> `node --test tests/*.test.js`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run deadcode:audit-dashboard-components` (import-graph reachability audit from `src/app/**` into legacy dashboard component scopes)
- `npm run test:integration:local` (boots local Supabase, applies migrations via reset, runs `tests/integration/*.test.js`)

## Current automated test scope (and limitations)
Implemented test files currently validate codebase contracts such as:
- auth/account route presence and expected operations,
- company-scoped finance ownership filters,
- posting immutability/reversal contract markers,
- receipt upload validation constraints,
- API auth/membership/permission enforcement markers for key `/api` routes,
- transaction + entitlement boundary validation markers,
- deterministic golden dataset fixture structure for datasets 1, 4, and 5.

Limitations to state explicitly:
- Tests are source/migration contract assertions (string/pattern checks), not full runtime integration tests.
- Database-seeded integration tests now live under `tests/integration/*.test.js` and are run via `npm run test:integration:local` (separate from fast contract tests in `npm run test`).
- No e2e browser flow tests are currently wired into scripts.
- VAT/tax engine behavior is not covered because the engine is still planned.

## Testing layers to expand (target)

### Unit tests (target)
- Pure domain logic:
  - VAT calculation and rounding,
  - period lock and reversal rules,
  - report aggregation math (decimal-safe).

### Integration tests (current + target)
Current executable integration suite (`tests/integration/supabase-rls-and-posting.integration.test.js`) covers core DB-backed API invariants using local Supabase auth + RLS:
- cross-tenant denial and same-company allow for `transactions`, `categories`, `receipts` (backing `/api/transactions`, `/api/categories`, `/api/receipts`),
- role-based write denial for `read_only`,
- posting/reversal immutability enforcement (`journal_entries` append-only behavior) and period-lock precondition query behavior.

Planned expansion:
- HTTP-level route integration assertions with authenticated cookie/session wiring against the Next.js API layer.
- migration rollback/recovery rehearsal automation.
- storage bucket upload/read policy assertions at object level.

### End-to-end tests (target)
- Auth lifecycle (signup, login, logout, protected redirects).
- Transaction + category + receipt flows.
- Invitation acceptance flow (once implemented).
- VAT/tax workflows (once implemented).

## Regression-critical areas
- Ledger integrity and immutability controls.
- VAT/tax computations and adjustments.
- Report totals vs source transactions.
- Auth and cross-tenant isolation.
- Migration safety for existing production data.
- Permission boundaries on profile, team access, and receipts.

## Required checks before merge (current minimum)
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build` (recommended for schema/API/route changes)
5. `npm run deadcode:audit-dashboard-components` when refactoring dashboard/navigation component trees

### Integration CI gate policy
The PR CI workflow includes a separate **Integration (Supabase local)** job that runs `npm run test:integration:local` when either trigger is met:
- changed paths include `src/app/api/**`, `src/lib/postings/**`, `supabase/migrations/**`, `tests/integration/**`, `scripts/run-supabase-integration-tests.mjs`, or `.github/workflows/pr-ci.yml`, or
- the PR is labeled `ci:full-integration`.

This means integration checks are mandatory for API/postings/migration and related integration harness changes by default, and can be forced for any PR via label.

When the integration job runs, it uploads `integration-local-logs` artifacts with:
- integration command output,
- Supabase status output,
- Supabase local logs.

For docs-only changes, lint/typecheck are the baseline minimum.

## Periodic dead-code audit process
- Run `npm run deadcode:audit-dashboard-components` at least once per sprint even if no dashboard PR is in flight.
- Treat any newly reachable file under archived/legacy dashboard scopes as a review trigger:
  - verify the import is intentional,
  - move the file back to an active component path if needed,
  - update README/docs paths in the same PR.

## Current gaps summary
- Integration harness exists for local Supabase, but HTTP-level Next.js route integration coverage is still pending.
- No e2e browser flow coverage yet.
- CI policy now documents conditional integration gating; branch-protection enforcement mode is still a governance decision.
