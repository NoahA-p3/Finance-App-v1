# Spec-Linked Test Plans (Invoicing, Reconciliation, VAT Review)

**As of:** 2026-03-29.

Related architecture specs:
- [Invoicing Minimal Lifecycle Technical Spec](../architecture/INVOICING_MINIMAL_LIFECYCLE_SPEC.md)
- [Bank/Reconciliation Baseline Technical Spec](../architecture/BANK_RECONCILIATION_BASELINE_SPEC.md)
- [VAT Review Baseline Technical Spec](../architecture/VAT_REVIEW_BASELINE_SPEC.md)

## 1) Invoicing minimal lifecycle test plan

### Core scenarios
- Draft invoice create with decimal-safe line totals.
- Issue transition only from `draft`.
- Partial and full payment transitions with deterministic total checks.
- Void transition with mandatory reason audit event.

### API boundary/security scenarios
- Reject client-supplied tenancy/authorship fields.
- Deny cross-tenant invoice read/write attempts.
- Deny delete attempts for invoice header/line/event records.

### Data integrity checks
- `(company_id, invoice_number)` uniqueness.
- `paid_total <= grand_total` invariant unless explicit overpayment path is defined.
- Event append-only constraints.

### Suggested execution commands
- `npm run test`
- `npm run test:integration:local` (once `/api/invoices/*` routes exist)

## 2) Bank/reconciliation baseline test plan

### Core scenarios
- Session create/list/close lifecycle including blocked-close with unresolved critical items.
- Match create/confirm/reject paths with deterministic open-item counts.
- Unmatched item listing pagination and stable ordering.

### API boundary/security scenarios
- Reject matches referencing foreign-company objects.
- Enforce role gating for close and confirm actions.
- Validate no sensitive bank identifiers are exposed in API error payloads.

### Data integrity checks
- Statement-entry dedupe hash uniqueness.
- Closed-session mutation restrictions.
- Reconciliation event append-only behavior.

### Suggested execution commands
- `npm run test`
- `npm run test:integration:local` (once reconciliation routes/tables exist)

## 3) VAT review baseline test plan

### Core scenarios
- Deterministic preview parity for same input hash + engine version.
- Period generate and approve lifecycle transitions.
- Totals consistency checks (`output - input = net`).

### API boundary/security scenarios
- Unauthorized mutation denial for VAT code overrides and review approval.
- Cross-tenant VAT run/review visibility denial.
- Malformed rate and overlapping-period validation responses.

### Data integrity checks
- Single active review per company-period.
- Event append-only constraints for review actions.
- Explainability payload shape regressions guarded by snapshot/contract tests.

### Suggested execution commands
- `npm run test`
- `npm run test:integration:local` (when VAT review routes/tables land)
