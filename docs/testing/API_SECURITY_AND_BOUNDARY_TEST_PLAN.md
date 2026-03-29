# API Security and Boundary Test Plan

Related docs: [Test Strategy](./TEST_STRATEGY.md), [Golden Datasets](./GOLDEN_DATASETS.md), [Security Rules](../security/SECURITY_RULES.md).

**Plan date:** 2026-03-27.

## Goal
Establish an initial executable regression layer for API auth gates, company isolation, role permissions, transaction validation + entitlement boundaries, receipt upload boundaries, and deterministic fixture coverage.

## Current test model
- The baseline suite is split across fast Node contract tests (`tests/*.test.js`) and Supabase-backed integration tests (`tests/integration/*.test.js`).
- Supabase integration execution is wired through `scripts/run-supabase-integration-tests.mjs` (used by `npm run test:integration:local`) to start local Supabase, reset/apply migrations, run integration tests, and shut Supabase down.
- Current integration coverage includes cross-tenant isolation, `read_only` write denial, and posting/period-lock immutability invariants in `tests/integration/supabase-rls-and-posting.integration.test.js`.
- **As of:** 2026-03-29.

## Scope for this test-plan slice
1. API auth enforcement for key route handlers in `src/app/api/*`.
2. Company isolation and role-based permission checks in `/api/companies/*` plus finance routes.
3. Transaction validation and entitlement enforcement edge contracts in:
   - `src/app/api/transactions/route.ts`
   - `src/lib/entitlements.ts`
4. Receipt upload boundary contracts in `src/app/api/receipts/route.ts`.
5. Deterministic fixtures aligned with `docs/testing/GOLDEN_DATASETS.md`.

## Suite map

### Suite A — API auth + permission contracts
- File: `tests/api-auth-and-permissions.test.js`
- Verifies:
  - key route handlers call `requireAuthenticatedApiUser`.
  - unauthorized responses return 401 on guarded routes.
  - company-membership enforcement returns expected 404/403 where relevant.
  - role-based permission checks are present for members/invitations/settings management.

### Suite B — Transaction + entitlement boundary contracts
- File: `tests/transactions-entitlements-boundary.test.js`
- Verifies:
  - transaction payload boundary rules (JSON object, date/type/UUID validation, decimal amount normalization).
  - category/receipt IDs are validated inside active company context.
  - entitlement soft-lock and warning payload structure is preserved.
  - entitlement computations use decimal-safe `bigint` cent math and company-scoped usage reads.

### Suite C — Receipt upload boundary contracts
- File: `tests/receipts-upload-boundary-contract.test.js`
- Verifies:
  - auth + membership gating before upload operations.
  - MIME allowlist and max-size enforcement.
  - unsafe filename rejection and deterministic object key construction.
  - private-path insertion fields remain `user_id`, `company_id`, `path` only.

### Suite D — Golden dataset fixture determinism
- Files:
  - `tests/fixtures/golden-datasets.js`
  - `tests/golden-dataset-fixtures.test.js`
- Verifies:
  - deterministic scenario IDs and fixed timestamps.
  - decimal-safe amount strings (no float fixture values).
  - dataset alignment with named scenarios in `docs/testing/GOLDEN_DATASETS.md`.

## Deterministic fixture conventions
- IDs: static UUID strings.
- Dates/timestamps: fixed UTC ISO strings.
- Amounts: decimal strings (`"1234.56"`) only.
- Scenario names: keep stable labels matching Golden Datasets entries.

## Out of scope in this slice
- live Supabase integration/RLS execution tests.
- browser/e2e flows.
- VAT/tax computational correctness tests beyond fixture scaffolding.

## Next expansion (TODO)
1. Add integration harness for route execution against ephemeral Supabase DB.
2. Seed fixtures into test database and validate RLS by user identity.
3. Add report snapshot assertions against golden fixtures.
4. Add mutation tests for append-only posting and period lock workflow.
