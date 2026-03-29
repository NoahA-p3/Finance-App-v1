# Invoicing Minimal Lifecycle Technical Spec

**Status:** planned.  
**As of:** 2026-03-29.

Related docs: [PRD](../product/PRD.md), [MVP Scope](../product/MVP_SCOPE.md), [DK VAT Rules](../domain/DK_VAT_RULES.md), [Security Rules](../security/SECURITY_RULES.md), [Invoicing test plan section](../testing/SPEC_ROADMAP_TEST_PLANS.md#1-invoicing-minimal-lifecycle-test-plan).

## 1) Objective and boundaries
Define the minimum persisted sales-invoice lifecycle for MVP planning, with explicit AR data contracts and auditability constraints.

In scope:
- sales invoice draft creation,
- issue action,
- payment registration,
- terminal close states (`paid`, `voided`) using append-only event trails.

Out of scope:
- full dunning/collections,
- PDF rendering templates,
- legal-form-specific workflow branching (currently planned, not implemented).

## 2) Current baseline
- No first-class invoice schema exists in canonical runtime tables.
- No `/api/invoices/*` routes exist yet.
- Existing posting/audit baseline is append-only and must remain so.

## 3) Proposed schema deltas
Planned migration adds these company-scoped tables:

1. `sales_invoices`
   - identity + tenancy: `id`, `company_id`
   - numbering + counterpart: `invoice_number`, `customer_name`
   - lifecycle: `status` (`draft|issued|partially_paid|paid|voided`), `issue_date`, `due_date`
   - money fields (decimal/numeric): `subtotal_ex_vat`, `vat_total`, `grand_total`, `paid_total`, `currency_code`
   - audit columns: `created_by`, `updated_by`, `created_at`, `updated_at`

2. `sales_invoice_lines`
   - keys: `id`, `company_id`, `sales_invoice_id`, `line_no`
   - economics: `description`, `quantity_decimal`, `unit_price_decimal`, `line_subtotal_ex_vat`, `vat_code`, `vat_rate_decimal`, `vat_amount`, `line_total_inc_vat`

3. `invoice_events` (append-only)
   - `id`, `company_id`, `sales_invoice_id`, `event_type`, `event_payload_json`, `performed_by`, `created_at`

Constraints:
- Decimal-only storage for quantity and money fields.
- Unique `(company_id, invoice_number)`.
- No hard delete policy for compliance-relevant rows.

## 4) API contracts (planned)

### `POST /api/invoices`
Creates draft invoice.

Request (shape):
- `customerName`, `currencyCode`, `issueDate`, `dueDate`, `lines[]`.

Response:
- `201` with invoice aggregate + lines + lifecycle metadata.

Validation rules:
- Reject client-supplied `company_id`, `created_by`, `paid_total`.
- Reject negative quantity/unit price unless explicitly supported by credit-note flow (future).

### `GET /api/invoices`
List invoices for active company with optional status/date filters.

### `GET /api/invoices/{invoice_id}`
Returns invoice, lines, and event timeline.

### `POST /api/invoices/{invoice_id}/issue`
Transition `draft -> issued`; writes `invoice_events` row.

### `POST /api/invoices/{invoice_id}/record-payment`
Registers payment amount and date; transitions:
- `issued -> partially_paid`,
- `issued|partially_paid -> paid` when paid total reaches grand total.

### `POST /api/invoices/{invoice_id}/void`
Marks invoice voided and logs explicit reason in event payload.

## 5) Permissions and RLS baseline
Role policy (planned, using existing company RBAC patterns):
- `owner`, `admin`, `accountant`: create/update/issue/payment/void.
- `member`: read-only by default.

RLS expectations:
- `SELECT` only for active company members.
- `INSERT/UPDATE` allowed only for authorized roles in same company.
- `DELETE` denied on `sales_invoices`, `sales_invoice_lines`, and `invoice_events`.

Security notes:
- API never trusts client ownership fields.
- Event payload must exclude sensitive token/secrets.

## 6) Migration rollout and rollback notes
Rollout order:
1. Create tables + indexes + constraints.
2. Add RLS policies.
3. Add append-only protections for `invoice_events`.
4. Regenerate `src/types/database.ts` after schema push.

Rollback guidance:
- Disable write routes behind feature flag first.
- Snapshot/export invoice tables before destructive rollback.
- Reverse in dependency order: API writes off -> events table -> lines table -> header table.
- If rollback occurs after partial adoption, keep read-only recovery endpoint available for audit extraction.

## 7) Dependencies and delivery links
- Depends on existing company RBAC and active company context.
- Should precede reconciliation matching implementation.
- Tickets and acceptance checks are tracked in [tasks/EPICS.md](../../tasks/EPICS.md#7-invoicing-and-bills).
