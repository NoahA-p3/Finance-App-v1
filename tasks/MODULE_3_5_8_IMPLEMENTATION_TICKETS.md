# Implementation Tickets — Module 3, Module 8, and Module 5 Reconciliation Subset

**As of:** 2026-03-29.

Primary spec: [`docs/architecture/MODULE_3_5_8_BASELINE_TECH_SPECS.md`](../docs/architecture/MODULE_3_5_8_BASELINE_TECH_SPECS.md).

Dependency order:
1. Invoicing/bills data model and APIs
2. VAT/tax calculation engine and tests
3. Reconciliation/reporting/export outputs

## Ticket M3-001 — Invoicing and bills schema baseline

### Goal
Create AR/AP baseline tables and policies for invoices, invoice lines, bills, bill lines, and append-only events.

### Scope
- Add migration for module 3 table set and constraints.
- Add RLS and role-aware write policies.
- Update generated types.

### Acceptance criteria
- Migration introduces only company-scoped invoice/bill entities defined in the module spec.
- Monetary columns are decimal/numeric types (no float).
- RLS denies cross-tenant reads/writes in integration tests.
- No destructive-delete pathway for compliance-relevant docs.
- References aligned with:
  - Product expectations in [`docs/product/PRD.md`](../docs/product/PRD.md) and [`docs/product/MVP_SCOPE.md`](../docs/product/MVP_SCOPE.md)
  - Domain auditability constraints in [`docs/domain/DK_ACCOUNTING_RULES.md`](../docs/domain/DK_ACCOUNTING_RULES.md)
  - Security constraints in [`docs/security/SECURITY_RULES.md`](../docs/security/SECURITY_RULES.md)

### Verification
- `npm run lint`
- `npm run typecheck`
- Supabase integration tests for RLS and append-only behavior

### Rollback/recovery notes
- Reverse migration in dependency-safe order.
- Snapshot/export invoice and bill data before destructive rollback.
- Keep API write routes feature-flagged off until schema parity restored.

---

## Ticket M3-002 — Invoicing and bills API baseline

### Goal
Implement minimal invoice/bill route handlers with boundary validation and permission checks.

### Scope
- Add `/api/invoices*` and `/api/bills*` route handlers.
- Add service-layer status transition guards and event recording.

### Acceptance criteria
- Inputs validated at route boundary; ownership fields not trusted from clients.
- Role checks use existing company-permission patterns.
- Status transitions recorded in append-only events.
- API responses include deterministic decimal-safe totals.
- Aligned with:
  - API expectations in [`docs/architecture/API_CONTRACTS.md`](../docs/architecture/API_CONTRACTS.md)
  - Security boundary testing plan in [`docs/testing/API_SECURITY_AND_BOUNDARY_TEST_PLAN.md`](../docs/testing/API_SECURITY_AND_BOUNDARY_TEST_PLAN.md)

### Verification
- `npm run lint`
- `npm run typecheck`
- API contract/integration tests for 2xx/4xx/403/404 paths

### Rollback/recovery notes
- Disable write endpoints via feature flag.
- Preserve event table; avoid deletion of issued/approved records.

---

## Ticket M8-001 — VAT code/rule schema and deterministic calculator baseline

### Goal
Deliver baseline VAT code/rule model and deterministic calculation service for previews + period summaries.

### Scope
- Add VAT tables and RLS policies.
- Implement calculator service with explicit rounding approach.
- Seed documented VAT baseline codes only.

### Acceptance criteria
- Rule set + calculation run persistence exists and is tenant isolated.
- Calculation output is deterministic for same input/rule version.
- Explainability payload is returned (selected rule/rate/base/rounding).
- Assumptions/TODO markers used where legal-form-specific logic is not implemented.
- Aligned with:
  - Domain constraints in [`docs/domain/DK_VAT_RULES.md`](../docs/domain/DK_VAT_RULES.md) and [`docs/domain/LEGAL_FORM_RULES.md`](../docs/domain/LEGAL_FORM_RULES.md)
  - Product scope boundaries in [`docs/product/MVP_SCOPE.md`](../docs/product/MVP_SCOPE.md)

### Verification
- `npm run lint`
- `npm run typecheck`
- Golden dataset VAT scenarios per [`docs/testing/GOLDEN_DATASETS.md`](../docs/testing/GOLDEN_DATASETS.md)

### Rollback/recovery notes
- Feature-flag disable VAT calculation endpoints.
- Export and retain calculation runs before schema rollback for audit traceability.

---

## Ticket M8-002 — VAT API + test harness hardening

### Goal
Expose VAT calculate/summary APIs and add high-confidence boundary/regression tests.

### Scope
- Add `/api/vat/*` endpoints.
- Add input-validation, period overlap checks, and auth checks.
- Add deterministic regression tests.

### Acceptance criteria
- Unauthorized rule mutation attempts return 403.
- Invalid rates/period overlaps return clear 4xx errors.
- Snapshot tests confirm stable explainability payload structure.
- Coverage references:
  - [`docs/testing/TEST_STRATEGY.md`](../docs/testing/TEST_STRATEGY.md)
  - [`docs/testing/API_SECURITY_AND_BOUNDARY_TEST_PLAN.md`](../docs/testing/API_SECURITY_AND_BOUNDARY_TEST_PLAN.md)

### Verification
- `npm run lint`
- `npm run typecheck`
- VAT API integration + regression suite

### Rollback/recovery notes
- Keep existing invoice/bill APIs operational if VAT service is toggled off.
- Mark VAT summaries stale and require regeneration after rollback recovery.

---

## Ticket M5R-001 — Reconciliation session/match baseline

### Goal
Implement reconciliation subset for matching invoice/bill/open amounts to finance records.

### Scope
- Add reconciliation session/match tables + APIs.
- Add close workflow with append-only event semantics.

### Acceptance criteria
- Supports full/partial match and unmatched open-item flows.
- Cross-tenant access denied in tests.
- Closed sessions are non-destructively maintained.
- Aligned with:
  - Module intent in [`docs/product/DELIVERY_PHASES.md`](../docs/product/DELIVERY_PHASES.md)
  - Auditability expectations in [`docs/domain/DK_ACCOUNTING_RULES.md`](../docs/domain/DK_ACCOUNTING_RULES.md)

### Verification
- `npm run lint`
- `npm run typecheck`
- Reconciliation integration suite including permission boundaries

### Rollback/recovery notes
- Stop session-close endpoint before rollback.
- Retain match/event history for auditability; do not hard-delete closed sessions.

---

## Ticket M5R-002 — Reporting/export outputs driven by persisted data

### Goal
Ship report/export output contracts after module 3 + module 8 baseline dependencies are available.

### Scope
- Add report export metadata table + API.
- Add deterministic CSV/JSON export output for VAT summary, invoice aging, bill aging, and reconciliation open-items.

### Acceptance criteria
- Export outputs are generated from persisted module 3/module 8/module 5 data (not mock).
- Headers, decimal formatting, and ordering are deterministic.
- Export authorization and company isolation are enforced.
- Aligned with:
  - Reporting intent in [`docs/product/PRD.md`](../docs/product/PRD.md)
  - Testing expectations in [`docs/testing/TEST_STRATEGY.md`](../docs/testing/TEST_STRATEGY.md)

### Verification
- `npm run lint`
- `npm run typecheck`
- Export contract tests + deterministic fixture comparisons

### Rollback/recovery notes
- Disable export generation endpoints first.
- Preserve previously generated export artifacts in storage for downstream audit needs.

---

## Suggested execution sequence
1. `M3-001`
2. `M3-002`
3. `M8-001`
4. `M8-002`
5. `M5R-001`
6. `M5R-002`

This sequence enforces dependency order: **invoicing/bills model → VAT rules/tests → reporting/export outputs**.
