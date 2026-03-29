# Test Strategy

Related docs: [Golden Datasets](./GOLDEN_DATASETS.md), [Security Rules](../security/SECURITY_RULES.md), [DK VAT Rules](../domain/DK_VAT_RULES.md), [Spec-Linked Test Plans](./SPEC_ROADMAP_TEST_PLANS.md).

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
Implemented fast contract tests (`tests/*.test.js`) currently validate static codebase guardrails such as:
- auth/account route presence and expected operations,
- company-scoped finance ownership filters,
- posting immutability/reversal contract markers,
- receipt upload validation constraints,
- API auth/membership/permission enforcement markers for key `/api` routes,
- transaction + entitlement boundary validation markers,
- deterministic golden dataset fixture structure for datasets 1, 4, and 5.

Limitations to state explicitly:
- Contract tests in `tests/*.test.js` are static guardrails only (source/migration assertions) and are not treated as runtime behavior proof.
- Runtime integration tests live under `tests/integration/*.test.js` and are run via `npm run test:integration:local` (separate from fast contract tests in `npm run test`).
- No e2e browser flow tests are currently wired into scripts.
- VAT/tax engine behavior is not covered because the engine is still planned.

## Testing layers to expand (target)

### Unit tests (target)
- Pure domain logic:
  - VAT calculation and rounding,
  - period lock and reversal rules,
  - report aggregation math (decimal-safe).

### Integration tests (current + target)
Current executable integration suites (`tests/integration/*.integration.test.js`) run against local Supabase and split into two runtime boundaries:

1. **DB + RLS integration boundary** (`tests/integration/supabase-rls-and-posting.integration.test.js`)
   - cross-tenant denial and same-company allow for `transactions`, `categories`, `receipts` backing tables,
   - role-based write denial for `read_only`,
   - posting/reversal immutability enforcement (`journal_entries` append-only behavior) and period-lock precondition query behavior.

2. **HTTP route-handler integration boundary** (`tests/integration/next-route-handlers.integration.test.js`)
   - `/api/transactions`: request validation + entitlement soft-lock branch assertions,
   - `/api/categories`: permission-denied (`read_only`) and allowed (`owner`) assertions,
   - `/api/receipts`: file-validation branches (missing file + unsupported MIME),
   - `/api/postings/*`: permission-denied and period-lock failure-path assertions via route handlers.

Planned expansion:
- migration rollback/recovery rehearsal automation.
- storage bucket upload/read policy assertions at object level.
- end-to-end browser workflows layered above these route-level checks.

#### Short expansion plan (first targets)
1. `/api/transactions` validation + entitlement edge handling  
   - **Coverage type:** route-handler integration  
   - **Suite target:** `tests/integration/next-route-handlers.integration.test.js`
2. `/api/receipts` upload validation and permission branches  
   - **Coverage type:** route-handler integration  
   - **Suite target:** `tests/integration/next-route-handlers.integration.test.js`
3. Invitation accept lifecycle edge cases  
   - **Coverage type:** route-handler integration  
   - **Suite target:** `tests/integration/next-route-handlers.integration.test.js`
4. Posting reversal/lock edge cases  
   - **Coverage type:** DB/RLS integration  
   - **Suite target:** `tests/integration/supabase-rls-and-posting.integration.test.js`

### End-to-end tests (target)
- Auth lifecycle (signup, login, logout, protected redirects).
- Transaction + category + receipt flows.
- Invitation acceptance flow (once implemented).
- VAT/tax workflows (once implemented).


## Spec-linked roadmap test-plan sections
The following planned modules now have explicit test-plan sections with acceptance-oriented coverage targets:
- [Invoicing minimal lifecycle](./SPEC_ROADMAP_TEST_PLANS.md#1-invoicing-minimal-lifecycle-test-plan)
- [Bank/reconciliation baseline](./SPEC_ROADMAP_TEST_PLANS.md#2-bankreconciliation-baseline-test-plan)
- [VAT review baseline](./SPEC_ROADMAP_TEST_PLANS.md#3-vat-review-baseline-test-plan)

## Regression-critical areas
- Ledger integrity and immutability controls.
- VAT/tax computations and adjustments.
- Report totals vs source transactions.
- Auth and cross-tenant isolation.
- Migration safety for existing production data.
- Permission boundaries on profile, team access, and receipts.

## Money-format contract (dashboard/reporting)
- For persisted finance outputs that represent money totals/trends, use bigint-safe cent strings (for example `"123456"` for DKK 1,234.56) instead of JS `number`.
- Keep arithmetic in bigint space in data-composition modules (`src/lib/**`) and only convert to display strings at render boundaries.
- Chart components must accept string-safe money inputs and apply formatting in render callbacks/tooltips, not in backend aggregation paths.
- Regression tests for money handling should include values above JS safe integer when expressed in cents.
- `formatCurrencyFromCents(cents, currencyCode?)` in `src/lib/dashboard-data.ts` is the canonical formatter contract for dashboard/reporting cards and tables:
  - accepted `cents` inputs: `bigint` or bigint-string (`type CentsString = \`${bigint}\``),
  - converts to absolute bigint cents, then splits into whole/fraction strings (`whole = abs / 100n`, `fraction = abs % 100n` padded to 2),
  - applies en-US grouping to the whole part and reuses `Intl.NumberFormat("en-US", { style: "currency", currency })` currency affixes,
  - prepends `-` for negative values,
  - must not use `Number(cents)` conversion so values above JS safe-integer cents remain exact.

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
- Integration harness now covers both DB/RLS invariants and HTTP-level Next.js API route behavior for key finance routes.
- Contract tests remain static guardrails and do not replace runtime integration coverage.
- No e2e browser flow coverage yet.
- CI policy now documents conditional integration gating; branch-protection enforcement mode is still a governance decision.
