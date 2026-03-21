# Test Strategy

Related docs: [Golden Datasets](./GOLDEN_DATASETS.md), [Security Rules](../security/SECURITY_RULES.md), [DK VAT Rules](../domain/DK_VAT_RULES.md).

## Current test setup (observed)
- No dedicated automated test framework/scripts found in `package.json`.
- Available quality checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`

## Testing layers to establish

### Unit tests (target)
- Pure domain logic:
  - transaction classification helpers,
  - VAT calculation and rounding,
  - period lock and reversal rules,
  - report aggregation math (decimal-safe).

### Integration tests (target)
- API route handlers with Supabase test environment.
- RLS behavior by user identity.
- Migration correctness and backward compatibility checks.
- Storage policies for receipt upload/read/update/delete boundaries.

### End-to-end tests (target)
- Auth lifecycle (signup, login, logout, protected redirects).
- Transaction + category + receipt flows.
- Monthly/VAT review workflows once implemented.

## Regression-critical areas (must test)
- Ledger integrity and immutability controls.
- VAT/tax computations and adjustments.
- Report totals vs source transactions.
- Auth and cross-tenant isolation.
- Migration safety for existing production data.
- Permission boundaries on profile and receipt operations.

## Extra scrutiny rules
- Changes touching ledger/VAT/tax/reporting/auth/RLS/migrations require:
  - targeted tests,
  - reviewer checklist entry,
  - docs update in same PR.

## Required checks before merge (current minimum)
1. `npm run lint`
2. `npm run typecheck`
3. `npm run build` (recommended for schema/API/route changes)

For docs-only changes, lint/typecheck is sufficient unless docs tooling requires additional checks.

## Current gaps
- No executable tests for finance domain logic.
- No fixtures/golden dataset automation yet.
- No CI policy documented in repo.
