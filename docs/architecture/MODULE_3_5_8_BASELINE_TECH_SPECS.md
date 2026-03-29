# Module 3, Module 8, and Module 5-Reconciliation Baseline Technical Specs

**As of:** 2026-03-29.

Related source-of-truth docs:
- Product scope: [`docs/product/PRD.md`](../product/PRD.md), [`docs/product/MVP_SCOPE.md`](../product/MVP_SCOPE.md), [`docs/product/DELIVERY_PHASES.md`](../product/DELIVERY_PHASES.md), [`docs/product/PRODUCT_MODULE_MAP.md`](../product/PRODUCT_MODULE_MAP.md)
- Domain constraints: [`docs/domain/DK_ACCOUNTING_RULES.md`](../domain/DK_ACCOUNTING_RULES.md), [`docs/domain/DK_VAT_RULES.md`](../domain/DK_VAT_RULES.md), [`docs/domain/LEGAL_FORM_RULES.md`](../domain/LEGAL_FORM_RULES.md)
- Testing standards: [`docs/testing/TEST_STRATEGY.md`](../testing/TEST_STRATEGY.md), [`docs/testing/GOLDEN_DATASETS.md`](../testing/GOLDEN_DATASETS.md), [`docs/testing/API_SECURITY_AND_BOUNDARY_TEST_PLAN.md`](../testing/API_SECURITY_AND_BOUNDARY_TEST_PLAN.md)
- Security constraints: [`docs/security/SECURITY_RULES.md`](../security/SECURITY_RULES.md)

---

## 0) Scope and dependency order

This specification defines explicit schema/API/test scope for:
1. **Module 3 (Invoicing baseline + bills data model subset)**
2. **Module 8 (VAT/tax engine baseline)**
3. **Module 5 reconciliation subset + Module 9 reporting/export outputs dependent on #1 and #2**

> Note on module numbering: this document follows the sequencing used in `tasks/EPICS.md` where Module 8 is VAT/tax. `docs/product/PRODUCT_MODULE_MAP.md` currently uses a different numbering system. This is a known cross-doc numbering mismatch to resolve in a follow-up docs-alignment ticket.

### Delivery order (required)
1. **Invoicing/bills data model and APIs first**
2. **VAT calculation rules + deterministic tests second**
3. **Reporting/export outputs third (fed by prior modules)**

---

## 1) Module 3 — Invoicing baseline (AR/AP)

### 1.1 Goal
Create a minimal persisted invoicing/bills baseline that supports:
- sales invoice creation + lifecycle status updates,
- purchase bill creation + lifecycle status updates,
- traceable line-level VAT metadata,
- linkage points for later reconciliation and reporting.

### 1.2 Current behavior
- No first-class invoice/bill schema in runtime evidence scope.
- No invoice/bill API resources.
- Posting baseline exists and should remain append-only.

### 1.3 Proposed schema scope
Create new company-scoped tables (UUID PKs, timestamp audit columns, strict RLS):

1. `sales_invoices`
   - `id`, `company_id`, `invoice_number` (unique per company), `customer_name`, `currency_code`,
   - `issue_date`, `due_date`, `status` (`draft|issued|partially_paid|paid|voided`),
   - `subtotal_ex_vat`, `vat_total`, `grand_total`, `paid_total`,
   - `source_transaction_id` nullable (future linkage),
   - `created_by`, `updated_by`, `created_at`, `updated_at`.

2. `sales_invoice_lines`
   - `id`, `company_id`, `sales_invoice_id`, `line_no`, `description`, `quantity_decimal`, `unit_price_decimal`,
   - `line_subtotal_ex_vat`, `vat_code`, `vat_rate_decimal`, `vat_amount`, `line_total_inc_vat`.

3. `purchase_bills`
   - `id`, `company_id`, `bill_number`, `vendor_name`, `currency_code`,
   - `bill_date`, `due_date`, `status` (`draft|approved|partially_paid|paid|voided`),
   - `subtotal_ex_vat`, `vat_total`, `grand_total`, `paid_total`,
   - `receipt_id` nullable (existing receipts integration),
   - `created_by`, `updated_by`, `created_at`, `updated_at`.

4. `purchase_bill_lines`
   - `id`, `company_id`, `purchase_bill_id`, `line_no`, `description`, `quantity_decimal`, `unit_cost_decimal`,
   - `line_subtotal_ex_vat`, `vat_code`, `vat_rate_decimal`, `vat_amount`, `line_total_inc_vat`.

5. `invoice_bill_events` (append-only)
   - `id`, `company_id`, `entity_type` (`sales_invoice|purchase_bill`), `entity_id`,
   - `event_type`, `event_payload_json`, `performed_by`, `created_at`.

Constraints:
- Monetary and quantity values use decimal/numeric columns only (no floats).
- `company_id` required on all rows, with FK and RLS alignment.
- Company-local unique keys for document numbering.
- Status transitions are controlled in service layer with event logging.

### 1.4 Proposed API scope
Route groups under `src/app/api`:
- `GET/POST /api/invoices`
- `GET/PATCH /api/invoices/{invoice_id}`
- `POST /api/invoices/{invoice_id}/issue`
- `POST /api/invoices/{invoice_id}/record-payment`
- `GET/POST /api/bills`
- `GET/PATCH /api/bills/{bill_id}`
- `POST /api/bills/{bill_id}/approve`
- `POST /api/bills/{bill_id}/record-payment`

Boundary validations:
- Reject client-controlled ownership changes (`company_id`, `created_by`, etc.).
- Enforce decimal-safe parsing and quantization strategy before persistence.
- Require active company membership; deny cross-tenant access.

### 1.5 Permission model
Role baseline using existing company RBAC patterns:
- `owner`, `admin`: full create/update/issue/approve/payment actions.
- `accountant`: create/update + issue/approve + payment recording.
- `member`: read-only by default (write optional behind explicit feature flag).

RLS expectations:
- `SELECT` limited to rows where user is active member of `company_id`.
- `INSERT/UPDATE` guarded by role policy helpers.
- `DELETE` disabled for compliance-relevant documents; use `voided` + event trail.

### 1.6 Migration plan
1. Add migration creating the five tables, constraints, indexes, and RLS policies.
2. Add immutable-event trigger protections for `invoice_bill_events`.
3. Update generated DB types (`src/types/database.ts`).
4. Add API/service wiring in `src/app/api/*` and `src/lib/*`.
5. Add deterministic fixture rows for module-level integration tests.

### 1.7 Rollback / recovery notes
- Rollback by new migration that drops only newly introduced API functions/policies/tables in reverse dependency order.
- Before rollback in production-like data:
  - snapshot affected tables,
  - export unposted invoice/bill documents,
  - verify references from downstream reporting jobs.
- If partial deploy failure occurs, disable write endpoints and keep read-only recovery mode until schema parity is restored.

### 1.8 Test scope
- Contract tests for each route status path + boundary validation.
- Integration tests for RLS cross-tenant denial.
- Ledger-adjacent invariants: no destructive deletion, event append-only checks.
- Decimal precision tests for line totals and document totals.

---

## 2) Module 8 — VAT/tax engine baseline

### 2.1 Goal
Provide deterministic VAT calculation and explainable rule application for invoices, bills, and expense/reconciliation outputs.

### 2.2 Current behavior
- VAT/tax engine is planned and not implemented.
- Danish VAT domain rules exist in docs but are not fully encoded in runtime policy/rules engine.

### 2.3 Proposed schema scope
New table set:
1. `vat_codes`
   - `id`, `company_id` nullable (global defaults + company overrides),
   - `code`, `description`, `rate_decimal`, `direction` (`output|input|both`), `is_active`.

2. `vat_rule_sets`
   - `id`, `company_id`, `name`, `effective_from`, `effective_to` nullable, `is_default`.

3. `vat_rule_entries`
   - `id`, `vat_rule_set_id`, `priority`, `condition_json`, `result_vat_code`, `result_rate_decimal`, `notes`.

4. `vat_calculation_runs`
   - `id`, `company_id`, `run_type` (`invoice_preview|bill_preview|period_summary`),
   - `input_ref_type`, `input_ref_id`, `engine_version`, `calculated_at`, `calculation_json`, `hash`.

5. `vat_period_summaries`
   - `id`, `company_id`, `period_start`, `period_end`, `output_vat_total`, `input_vat_total`, `net_vat_payable`, `status`.

### 2.4 Proposed API scope
- `GET /api/vat/codes`
- `POST /api/vat/calculate` (idempotent preview; no posting side effects)
- `POST /api/vat/period-summaries/generate`
- `GET /api/vat/period-summaries`
- `GET /api/vat/period-summaries/{summary_id}`

API guarantees:
- Include explainability fields (selected rule, rate source, taxable base, rounding method).
- Return deterministic output for same input + rule-set version.
- No assumptions beyond codified repo evidence; missing legal-specific logic stays tagged as `TODO`/`Assumption`.

### 2.5 Permission model
- Read VAT codes/summaries: `owner|admin|accountant|member` (member access can be narrowed later).
- Modify rule sets / trigger official period summary generation: `owner|admin|accountant`.
- RLS: strict company scope, company override codes isolated from global defaults.

### 2.6 Migration plan
1. Introduce VAT code/rule/run/summary tables with indexes and RLS.
2. Seed baseline VAT codes strictly from documented domain references (no undocumented rule invention).
3. Add service-layer deterministic calculator with explicit decimal rounding strategy.
4. Expose calculate/summarize APIs.
5. Add regression datasets in testing fixtures.

### 2.7 Rollback / recovery notes
- Roll back by disabling VAT endpoints first (feature flag), then reverse migration for VAT tables.
- Preserve exported run artifacts (`vat_calculation_runs`) before rollback for auditability.
- Recovery path: restore latest backup, replay non-destructive setup migrations, rerun summary generation in dry-run mode to verify deterministic parity.

### 2.8 Test scope
- Golden dataset coverage for VAT scenarios in `docs/testing/GOLDEN_DATASETS.md` style.
- Precision/rounding tests for decimal-safe outcomes.
- API boundary tests for malformed rates, period overlaps, and unauthorized rule mutation.
- Snapshot tests for explainability payload structure.

---

## 3) Module 5 reconciliation subset + reporting/export dependency output

### 3.1 Goal
Implement reconciliation subset that matches invoice/bill/open amounts to recorded transaction flows, then exposes reliable export/report output contracts.

### 3.2 Current behavior
- Receipt upload exists, but reconciliation workbench and report/export contracts are limited.

### 3.3 Proposed schema scope
New reconciliation/reporting tables:
1. `reconciliation_sessions`
   - `id`, `company_id`, `period_start`, `period_end`, `status` (`open|review|closed`), `created_by`, `closed_by`.
2. `reconciliation_matches`
   - `id`, `company_id`, `session_id`, `match_type` (`invoice_payment|bill_payment|expense_match`),
   - `left_ref_type`, `left_ref_id`, `right_ref_type`, `right_ref_id`, `match_amount`, `confidence_score_decimal`, `match_status`.
3. `report_exports`
   - `id`, `company_id`, `report_type` (`vat_summary|invoice_aging|bill_aging|reconciliation_open_items`),
   - `period_start`, `period_end`, `format` (`csv|json`), `storage_path`, `created_by`, `created_at`.

### 3.4 Proposed API scope
- `POST /api/reconciliation/sessions`
- `GET /api/reconciliation/sessions`
- `POST /api/reconciliation/sessions/{session_id}/matches`
- `POST /api/reconciliation/sessions/{session_id}/close`
- `GET /api/reconciliation/open-items`
- `POST /api/reports/exports`
- `GET /api/reports/exports`

Report/export outputs must be driven by persisted data from module 3 + module 8 tables (not mock data).

### 3.5 Permission model
- Reconciliation create/match/close: `owner|admin|accountant`.
- Export generation: `owner|admin|accountant`; view exports: all company members with configurable restriction.
- RLS policies: company isolation plus row ownership checks for created artifacts.

### 3.6 Migration plan
1. Add reconciliation + export tables, indexes, and RLS.
2. Add service for deterministic open-item derivation.
3. Add export generation pipeline (CSV/JSON baseline) with audit-safe metadata storage.
4. Wire APIs and dashboard/report integrations.

### 3.7 Rollback / recovery notes
- Feature-flag disable reconciliation close and export endpoints before schema rollback.
- Keep generated exports in storage for audit continuity even if API is rolled back.
- Recovery validation:
  - compare pre/post rollback open-item counts,
  - verify no closed sessions lose event traces,
  - rerun export generation for a known deterministic period.

### 3.8 Test scope
- Reconciliation matching tests (full, partial, overpayment cases).
- Cross-tenant security tests for session/match visibility.
- Export contract tests (stable headers, decimal formatting, deterministic sort order).
- Integration tests confirming report values reconcile with source invoice/bill/VAT tables.

---

## 4) Cross-module non-functional requirements

1. **Decimal correctness:** all money and quantity calculations must use exact decimal handling.
2. **Auditability:** destructive updates/deletes are avoided for compliance-relevant records.
3. **Security:** avoid sensitive logging and enforce company isolation across all new endpoints.
4. **Docs alignment:** if runtime behavior diverges from this spec, update `docs/product/*`, `docs/domain/*`, and `docs/testing/*` references in the same delivery unit.

## 5) Open assumptions / TODO markers
- **Assumption:** initial VAT code seed list will be constrained to documented rules in repo domain docs.
- **TODO:** legal-form-specific VAT/tax behavior for enkeltmandsvirksomhed vs ApS remains future scope unless explicitly added.
- **TODO:** PDF export support can follow after CSV/JSON deterministic contract baseline.
