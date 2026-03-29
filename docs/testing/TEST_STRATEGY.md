# Test Strategy

Related docs: [Golden Datasets](./GOLDEN_DATASETS.md), [Security Rules](../security/SECURITY_RULES.md), [DK VAT Rules](../domain/DK_VAT_RULES.md).

**Last verified:** 2026-03-29.

## Last-verified policy
- This date records when this testing guidance was last checked against real repository scripts/tests.
- Update it whenever test commands, coverage claims, or CI gates in this file are changed.

## Current test setup (observed)
Current executable commands in `package.json`:
- `npm run test` -> `node --test tests/*.test.js tests/runtime/*.test.js`
- `npm run test:contract` -> `node --test tests/*.test.js`
- `npm run test:runtime` -> `node --test tests/runtime/*.test.js`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run deadcode:audit-dashboard-components`

## Contract vs runtime coverage matrix

| Critical area | Contract guard (fast, always-on) | Runtime guard (seeded DB / live route) | Current status |
| --- | --- | --- | --- |
| Auth boundary | `tests/api-auth-and-permissions.test.js` checks auth guard markers and 401 branches in key routes. | `tests/runtime/api-runtime.integration.test.js` asserts unauthenticated `GET /api/transactions` returns 401. | Implemented (runtime is opt-in). |
| Tenancy isolation | `tests/company-shared-finance-ownership.test.js` + `tests/finance-write-permissions-rls.test.js` assert company-scoped ownership/RLS policy contracts. | `tests/runtime/api-runtime.integration.test.js` seeds two users in one company and verifies read-only member cannot read owner-owned transaction row. | Implemented (runtime is opt-in). |
| Posting immutability | `tests/posting-immutability-and-reversal.test.js` verifies migration/service immutability markers and reversal contract hooks. | `tests/runtime/api-runtime.integration.test.js` seeds a posted journal entry and asserts transaction mutation fails with trigger error. | Implemented (runtime is opt-in). |
| Finance write API path | `tests/api-auth-and-permissions.test.js` verifies explicit transaction write permission checks and server-owned fields. | `tests/runtime/api-runtime.integration.test.js` logs in seeded owner and asserts `POST /api/transactions` succeeds with company/user IDs derived from server context. | Implemented (runtime is opt-in). |

## Runtime harness design (seeded DB)
- Runtime tests require explicit environment configuration and are intentionally skipped unless all required variables are present and `RUNTIME_TESTS_ENABLED=1`.
- Required environment variables:
  - `RUNTIME_TESTS_ENABLED`
  - `RUNTIME_TEST_APP_BASE_URL`
  - `RUNTIME_TEST_SUPABASE_URL`
  - `RUNTIME_TEST_SUPABASE_ANON_KEY`
  - `RUNTIME_TEST_SUPABASE_SERVICE_ROLE_KEY`
- Seed strategy:
  - Create deterministic test users via Supabase admin API.
  - Seed company, memberships, and active-company profile context.
  - Execute selected API route checks plus direct runtime RLS/trigger assertions.
  - Cleanup seeded records after test completion.

## CI-required gates
GitHub Actions PR workflow (`.github/workflows/ci.yml`) enforces the following gates:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`

Additional required check by change type:
4. `npm run build` for schema/API/route/import changes.
5. `npm run deadcode:audit-dashboard-components` when refactoring dashboard/navigation component trees.

## Testing layers and intent

### Contract tests (current default)
- Fast source/migration invariant checks that run in all environments.
- Primary role: early guardrails on auth checks, RLS policy shape, API input boundaries, and posting/reversal contract markers.
- Limitation: does not prove live runtime behavior against Supabase policies/triggers.

### Runtime integration tests (initial harness)
- Execute selected API route and database behavior against a seeded test Supabase environment.
- Primary role: validate critical runtime assertions where contracts alone are insufficient (auth boundary, tenancy isolation, posting immutability).
- Limitation: depends on dedicated environment and secrets; currently opt-in.

### End-to-end tests (planned)
- Browser/user journey tests are still planned, not yet wired.

## Regression-critical areas
- Ledger integrity and immutability controls.
- VAT/tax computations and adjustments (engine still planned).
- Report totals vs source transactions.
- Auth and cross-tenant isolation.
- Migration safety for existing production data.
- Permission boundaries on profile, team access, and receipts.

## Current gaps summary
- Runtime suite is currently opt-in and not yet mandatory in CI due infrastructure/secrets dependency.
- No browser e2e flow tests wired into scripts yet.
- VAT/tax engine behavior remains uncovered because the engine is still planned.
