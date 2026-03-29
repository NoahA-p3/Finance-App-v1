# INV-MLC Implementation Tickets (Execution Sequence)

**As of:** 2026-03-29.  
**Source sequence:** [`tasks/EPICS.md` §7 Invoicing and bills](./EPICS.md#7-invoicing-and-bills).  
**Acceptance source of truth:** [`docs/architecture/INVOICING_MINIMAL_LIFECYCLE_SPEC.md`](../docs/architecture/INVOICING_MINIMAL_LIFECYCLE_SPEC.md).

## Scope note
This ticket set is intentionally limited to the explicit dependency-ordered sequence requested for invoicing minimal lifecycle delivery:
1. `INV-MLC-001` schema + RLS + rollback notes,
2. `INV-MLC-002` invoice lifecycle API routes,
3. `INV-MLC-003` audit immutability + integration coverage.

---

## 1) `INV-MLC-001` — Invoice schema + RLS + rollback baseline

### Goal
Introduce the minimal persisted invoice schema and role-aware tenant isolation aligned to the invoicing minimal lifecycle spec.

### Dependencies
- Existing company tenancy + RBAC runtime baseline (`public.company_memberships`, active-company context).

### Required implementation scope
- Add one new migration introducing:
  - `sales_invoices`,
  - `sales_invoice_lines`,
  - `invoice_events` (append-only intent).
- Enforce decimal-safe numeric columns for quantity/money values.
- Enforce uniqueness on `(company_id, invoice_number)`.
- Add RLS policies for company-scoped read/write access according to role rules in spec.
- Regenerate schema contract (`src/types/database.ts`) after migration is applied.
- Update `supabase/migrations/MIGRATION_ORDER.md` with the new migration.

### Acceptance criteria
- Schema matches planned entities and lifecycle/status contracts from the acceptance spec.
- API-facing ownership fields remain server-owned by design (no client ownership authority embedded in schema defaults).
- Cross-tenant reads and writes are denied by policy.
- No hard-delete pathway for compliance-relevant invoice records/events.
- **Migration compatibility gate:** migration file includes exact marker line:
  - `-- Rollback / recovery notes:`
  - (required for `scripts/check-migration-order.mjs` compatibility).
- Rollback notes document:
  - pre-drop snapshot/export,
  - reverse dependency order (`invoice_events` → `sales_invoice_lines` → `sales_invoices`),
  - route-write disable/feature-flag step before destructive rollback.

### Verification
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- migration governance checks (including rollback marker validation)
- integration checks proving RLS company isolation for invoice tables

---

## 2) `INV-MLC-002` — Invoice minimal lifecycle API routes

### Goal
Implement minimal invoice lifecycle endpoints and transitions (`draft`, `issued`, `partially_paid`, `paid`, `voided`) using append-only events.

### Dependencies
- `INV-MLC-001`

### Required implementation scope
- Add/complete invoice route handlers:
  - `POST /api/invoices`
  - `GET /api/invoices`
  - `GET /api/invoices/{invoice_id}`
  - `POST /api/invoices/{invoice_id}/issue`
  - `POST /api/invoices/{invoice_id}/record-payment`
  - `POST /api/invoices/{invoice_id}/void`
- Validate request payloads at route boundary.
- Reject client-supplied ownership/system fields (`company_id`, `created_by`, `paid_total`, etc.).
- Apply role checks using existing company-permission patterns.
- Persist lifecycle events to `invoice_events` for each mutation action.

### Acceptance criteria
- Route set matches acceptance spec contract and transition rules.
- Invalid transitions are rejected with explicit 4xx responses.
- Payment registration transitions only occur according to paid-total thresholds.
- Void action requires and records explicit reason payload.
- Sensitive data and secrets are excluded from event payload logging.

### Verification
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- API tests covering:
  - happy paths,
  - invalid payloads,
  - invalid status transitions,
  - unauthorized role attempts,
  - cross-tenant access denial.

---

## 3) `INV-MLC-003` — Audit immutability + integration coverage

### Goal
Harden append-only behavior for invoice lifecycle events and provide integration-level evidence for tenancy and role boundaries.

### Dependencies
- `INV-MLC-002`

### Required implementation scope
- Add DB protections preventing updates/deletes on `invoice_events`.
- Ensure API behavior never mutates historical invoice events in place.
- Add/extend integration coverage for:
  - append-only enforcement,
  - cross-tenant denial,
  - role-based mutation restrictions,
  - deterministic lifecycle-event timeline ordering.
- Add spec-linked test plan updates in docs/testing where executed commands/results are recorded.

### Acceptance criteria
- `invoice_events` is enforceably append-only in both DB and API behavior.
- Integration tests prove event immutability and tenant isolation regressions are caught.
- Test-plan documentation references executed verification commands and outcomes.
- Any missing coverage is explicitly called out as `TODO`/gap with rationale.

### Verification
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Supabase-backed integration suite for invoice lifecycle/RLS/immutability

---

## Delivery order (must follow exactly)
1. `INV-MLC-001`
2. `INV-MLC-002`
3. `INV-MLC-003`

No parallelization across these three tickets; each step depends on artifacts from the previous step.
