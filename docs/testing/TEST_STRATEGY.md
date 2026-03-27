# Test Strategy

Related docs: [Golden Datasets](./GOLDEN_DATASETS.md), [Security Rules](../security/SECURITY_RULES.md), [DK VAT Rules](../domain/DK_VAT_RULES.md).

**Last verified:** 2026-03-27.

## Last-verified policy
- This date records when this testing guidance was last checked against real repository scripts/tests.
- Update it whenever test commands or coverage claims in this file are changed or re-validated.

## Current test setup (observed)
Current executable commands in `package.json`:
- `npm run test` -> `node --test tests/*.test.js`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

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
- No database-seeded integration suite is currently wired into `npm test`.
- No e2e browser flow tests are currently wired into scripts.
- VAT/tax engine behavior is not covered because the engine is still planned.

## Testing layers to expand (target)

### Unit tests (target)
- Pure domain logic:
  - VAT calculation and rounding,
  - period lock and reversal rules,
  - report aggregation math (decimal-safe).

### Integration tests (target)
- API route handlers against a Supabase test environment.
- RLS behavior by user identity and company membership.
- Migration correctness and rollback/recovery checks.
- Storage policies for receipt upload/read/update/delete boundaries.

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

For docs-only changes, lint/typecheck are the baseline minimum.

## Current gaps summary
- No executable integration/e2e test harness yet.
- No automated golden dataset execution yet.
- No CI policy file documented in repo for mandatory gate enforcement.
