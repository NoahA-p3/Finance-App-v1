# EPICS Roadmap (Prioritized)

Status labels: **implemented**, **partial**, **planned**, **unknown**.

Related docs: [PRD](../docs/product/PRD.md), [System Overview](../docs/architecture/SYSTEM_OVERVIEW.md), [Test Strategy](../docs/testing/TEST_STRATEGY.md).

## Canonical module numbering mapping
The product-module source of truth is `docs/product/PRODUCT_MODULE_MAP.md` (Modules 1–12). This roadmap keeps **Epic numbers** for delivery sequencing and maps each epic to canonical product modules.

| Epic # (this file) | Canonical product module mapping |
|---|---|
| 1 Repo and developer foundation | Cross-cutting enabler (supports Modules 1–12) |
| 2 Accounting domain model | Module 4 |
| 3 Auth, tenancy, and roles | Module 1 |
| 4 Ledger core | Module 4 |
| 5 Transaction ingestion | Modules 4 and 5 |
| 6 Document capture | Module 5 |
| 7 Invoicing and bills | Module 3 |
| 8 VAT and tax engine | Module 4 (with Module 9 filing dependencies) |
| 9 Reports and exports | Module 12 (with Module 4 accounting dependencies) |
| 10 Integrations | Module 8 |
| 11 Security and operations | Cross-cutting enabler (supports Modules 1–12) |
| 12 UX polish and launch readiness | Modules 10 and 12 |

## Runtime status table (module → status)
**As of:** 2026-03-29 (cross-doc synchronized).

| Module | Status | Canonical product-module interpretation + scope note | Evidence |
|---|---|---|
| 1) Repo and developer foundation | partial | Cross-cutting enabler epic (not a single product module); scope is **engineering pipeline + test/runtime safeguards**. | CI baseline and both contract + Supabase integration test flows are documented and wired; deeper coverage breadth remains in progress. [`.github/workflows/pr-ci.yml`](../.github/workflows/pr-ci.yml), [`scripts/run-supabase-integration-tests.mjs`](../scripts/run-supabase-integration-tests.mjs), [`tests/integration/supabase-rls-and-posting.integration.test.js`](../tests/integration/supabase-rls-and-posting.integration.test.js) |
| 2) Accounting domain model | partial | Primarily Product Module 4 (Accounting Core); scope is **API/runtime model evidence**, not full reporting UX. | Transaction/category primitives are live, but full legal-form-aware canonical model is incomplete. [`src/app/api/transactions/route.ts`](../src/app/api/transactions/route.ts), [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql) |
| 3) Auth, tenancy, and roles | partial | Product Module 1; scope is **API/runtime auth + tenancy + role controls**. | Auth, membership, baseline roles, and invitation create/list/**accept** are implemented; richer production role matrix and invitation lifecycle hardening remain in progress. [`src/app/api/companies/invitations/route.ts`](../src/app/api/companies/invitations/route.ts), [`src/app/api/companies/invitations/accept/route.ts`](../src/app/api/companies/invitations/accept/route.ts), [`src/lib/company-permissions.ts`](../src/lib/company-permissions.ts), [`supabase/migrations/202603250002_company_rbac_baseline.sql`](../supabase/migrations/202603250002_company_rbac_baseline.sql) |
| 4) Ledger core | partial | Product Module 4; scope is **posting/runtime controls** rather than full accounting suite completion. | Posting, reversal, period locks, and immutability guards are implemented baseline; deeper accounting completeness still planned. [`src/app/api/postings/route.ts`](../src/app/api/postings/route.ts), [`src/app/api/postings/[posting_id]/reverse/route.ts`](../src/app/api/postings/%5Bposting_id%5D/reverse/route.ts), [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql) |
| 5) Transaction ingestion | partial | Product Modules 4 + 5; scope is **transaction ingestion runtime path only**. | Manual transaction API insert/list exists; import/matching engine absent. [`src/app/api/transactions/route.ts`](../src/app/api/transactions/route.ts) |
| 6) Document capture | partial | Product Module 5; scope is **receipt API/runtime baseline**. | Receipt upload/list API and storage constraints exist; OCR/linking UX depth is incomplete. [`src/app/api/receipts/route.ts`](../src/app/api/receipts/route.ts), [`supabase/migrations/202603200004_finance_assistant_mvp.sql`](../supabase/migrations/202603200004_finance_assistant_mvp.sql) |
| 7) Invoicing and bills | planned | Product Module 3; scope is **API/runtime evidence only**. | No invoice/bill runtime API or schema in evidence scope. |
| 8) VAT and tax engine | planned | Product Modules 4 + 9; scope is **VAT/tax runtime engine evidence only**. | No VAT/tax rule engine implementation in evidence scope. |
| 9) Reports and exports | partial | Product Module 12 (with Accounting Core dependencies); scope is **UI + API/data composition**. | Persisted dashboard/report summary logic exists; formal report/export contracts remain limited. [`src/lib/dashboard-data.ts`](../src/lib/dashboard-data.ts) |
| 10) Integrations | partial | Product Module 8; canonical mapping is Module 8; status is partial based on API/runtime evidence only (CVR adapter provides the current baseline). | Minimal CVR lookup adapter exists; broad connector/webhook/job platform is not implemented. [`src/app/api/companies/cvr/route.ts`](../src/app/api/companies/cvr/route.ts), [`src/lib/cvr/adapter.ts`](../src/lib/cvr/adapter.ts) |
| 11) Security and operations | partial | Cross-cutting enabler epic (supports all modules); scope is **controls/runbook maturity**, not end-user module UX. | Audit-event append-only controls and operations runbooks are present; ongoing maturity is around validation cadence/drills and deeper hardening. [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql), [`docs/ops/RESTORE_RUNBOOK.md`](../docs/ops/RESTORE_RUNBOOK.md), [`docs/ops/POST_RESTORE_VERIFICATION.md`](../docs/ops/POST_RESTORE_VERIFICATION.md) |
| 12) UX polish and launch readiness | partial | Product Modules 10 + 12; canonical mapping is Modules 10 and 12; support/learning/migration remains planned at API runtime while this epic tracks UI/readiness uplift. | Many production loops are still scaffold-level; persisted data has replaced some prior placeholders. [`src/lib/dashboard-data.ts`](../src/lib/dashboard-data.ts) |

## 1) Repo and developer foundation
- Objective: maintain reliable engineering baseline and documentation.
- Current status: **partial**.
- **As of:** 2026-03-29.
- Implemented baseline:
  - CI definition is present and enforces core checks on pull requests.
  - Fast contract tests and Supabase-backed integration tests are both wired in repository scripts.
- Evidence: [`.github/workflows/pr-ci.yml`](../.github/workflows/pr-ci.yml), [`scripts/run-supabase-integration-tests.mjs`](../scripts/run-supabase-integration-tests.mjs), [`tests/integration/supabase-rls-and-posting.integration.test.js`](../tests/integration/supabase-rls-and-posting.integration.test.js), [`README.md`](../README.md).
- Main gaps:
  - integration/e2e coverage depth is still expanding,
  - schema direction ambiguity across some migrations still needs governance.
- Epics:
  - docs-as-source-of-truth completion,
  - baseline quality gate hardening,
  - migration governance rules.
- Task ideas:
  - expand deterministic integration scenarios for more route boundaries,
  - add migration README/runbook refinements with rollback drills.
  - **Docs-alignment ticket (2026-03-29):** synchronize posting/audit capability claims across `docs/security/SECURITY_RULES.md`, `docs/architecture/TECHNICAL_MODULES.md`, and `tasks/EPICS.md` whenever posting/audit runtime behavior changes.
    - Scope: remove stale "missing audit table" / "journal planned" statements where repo evidence shows implemented posting/audit baseline.
    - Evidence requirements: include file-level bullets tied to `src/app/api/postings/*`, `src/lib/postings/service.ts`, and `supabase/migrations/202603270002_posting_and_audit_immutability.sql`.
    - Exit criteria: each changed claim includes an explicit `As of: YYYY-MM-DD` marker and direct evidence links.
- Major risks: drift between docs, schema, and runtime behavior.

## 2) Accounting domain model
- Objective: establish canonical accounting model for Denmark use cases.
- Current status: **partial**.
- **As of:** 2026-03-29.
- Implemented baseline: transaction/category primitives plus posting/journal baseline with reversal, period locks, and append-only audit event storage.
- Evidence (file-level):
  - Posting API runtime paths: `src/app/api/postings/route.ts`, `src/app/api/postings/[posting_id]/reverse/route.ts`, `src/app/api/postings/period-locks/route.ts`.
  - Posting/audit service behavior: `src/lib/postings/service.ts`.
  - Journal, period lock, audit schema + immutability triggers: `supabase/migrations/202603270002_posting_and_audit_immutability.sql`.
- Main gaps: legal-form-aware canonical model depth, VAT/tax engines, and broader accounting/reporting coverage remain incomplete.
- Epics:
  - canonical entity design,
  - chart/category strategy,
  - decimal-safe money handling.
- Task ideas:
  - ADR for ledger architecture,
  - align TypeScript types with decimal handling.
- Major risks: rework cost if model chosen too late.

## 3) Auth, tenancy, and roles
- Objective: secure multi-tenant behavior and role-aware collaboration.
- Current status: **partial**.
- **As of:** 2026-03-29.
- Implemented baseline:
  - company tenancy API surface exists under `src/app/api/companies/*` (company profile CRUD, company switch, members, invitation list/create, and invitation accept),
  - permission helpers and role checks exist in `src/lib/company-permissions.ts`,
  - foundational schema + RLS are in migrations `202603250001_companies_bootstrap.sql` and `202603250002_company_rbac_baseline.sql`.
- Evidence: [`src/app/api/companies/route.ts`](../src/app/api/companies/route.ts), [`src/app/api/companies/switch/route.ts`](../src/app/api/companies/switch/route.ts), [`src/app/api/companies/members/route.ts`](../src/app/api/companies/members/route.ts), [`src/app/api/companies/invitations/route.ts`](../src/app/api/companies/invitations/route.ts), [`src/app/api/companies/invitations/accept/route.ts`](../src/app/api/companies/invitations/accept/route.ts), [`src/lib/company-permissions.ts`](../src/lib/company-permissions.ts), [`supabase/migrations/202603250001_companies_bootstrap.sql`](../supabase/migrations/202603250001_companies_bootstrap.sql), [`supabase/migrations/202603250002_company_rbac_baseline.sql`](../supabase/migrations/202603250002_company_rbac_baseline.sql).
- Main gaps:
  - invitation lifecycle still needs deeper hardening (expiry/resend/revocation/completion-state coverage),
  - role model is still baseline-first and needs a richer, production-ready matrix across advanced roles.
- Epics:
  - invitation lifecycle hardening and membership activation completion,
  - richer role matrix and permission policy hardening,
  - auth flow hardening and tenancy integration test coverage.
- Task ideas:
  - add invitation edge-case coverage (expired/revoked/replayed token paths),
  - define and apply expanded role matrix constraints,
  - add permission/tenancy integration tests for same-company vs cross-company access.
- Major risks: unauthorized access if expanded without rigorous RLS.

## 4) Ledger core
- Objective: implement immutable posting and correction model.
- Current status: **partial**.
- As of 2026-03-27:
  - posting creation/list (`/api/postings`) exists,
  - reversal flow (`/api/postings/{posting_id}/reverse`) exists,
  - period lock flow (`/api/postings/period-locks`) exists,
  - DB-level immutability and append-only audit guards are present.
- Evidence: [`src/app/api/postings/route.ts`](../src/app/api/postings/route.ts), [`src/app/api/postings/[posting_id]/reverse/route.ts`](../src/app/api/postings/%5Bposting_id%5D/reverse/route.ts), [`src/app/api/postings/period-locks/route.ts`](../src/app/api/postings/period-locks/route.ts), [`src/lib/postings/service.ts`](../src/lib/postings/service.ts), [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql).
- Main gaps: posting baseline exists, but deeper production-grade bookkeeping behavior (full chart strategy, advanced adjustments, expanded controls) is still incomplete.
- Epics:
  - posting engine hardening,
  - reversal/correction flow expansion,
  - close-period controls + operational controls.
- Task ideas:
  - refine journal account mapping strategy,
  - add higher-coverage posting/reversal lock tests.
- Major risks: compliance and trust failures if immutability controls regress.

## 5) Transaction ingestion
- Objective: reduce manual entry via imports and matching.
- Current status: **partial** (manual API insert only).
- Main gaps: no bank integration/import parser, no matching engine.
- Epics:
  - import pipeline,
  - normalization and dedupe,
  - match confidence workflow.
- Task ideas:
  - CSV import prototype,
  - unmatched queue UI.
- Major risks: duplicate/incorrect postings.
- Related technical spec: [Bank/Reconciliation Baseline Technical Spec](../docs/architecture/BANK_RECONCILIATION_BASELINE_SPEC.md).

### Explicit tickets (dependency-ordered)
1. **ING-RECON-001 — Reconciliation schema + RLS baseline**
   - Dependencies: requires `INV-MLC-001` invoice schema references for AR/AP matching keys.
   - Acceptance checks:
     - migration adds reconciliation/session/match/event tables with company RLS,
     - cross-tenant read/write denial assertions are added,
     - rollback steps documented and tested in migration notes.
2. **ING-RECON-002 — Reconciliation API baseline (`/api/reconciliation/*`)**
   - Dependencies: `ING-RECON-001`.
   - Acceptance checks:
     - session create/list/match/close routes implemented with role checks,
     - close endpoint rejects unresolved critical mismatches,
     - API boundary tests cover invalid IDs and unauthorized role actions.
3. **ING-RECON-003 — Open-items deterministic contract**
   - Dependencies: `ING-RECON-002`.
   - Acceptance checks:
     - `/api/reconciliation/open-items` returns stable sort + pagination,
     - deterministic fixture test validates unchanged counts across reruns,
     - docs/testing spec section is updated with executed checks.

## 6) Document capture
- Objective: make receipt handling reliable and auditable.
- Current status: **partial** (upload path exists).
- Main gaps: weak linkage UX, no extraction/OCR metadata.
- Epics:
  - receipt lifecycle UX,
  - metadata extraction,
  - document completeness checks.
- Task ideas:
  - attach/detach receipt flow from transactions page,
  - validation on file size/type and error UX.
- Major risks: low documentation completeness.

## 7) Invoicing and bills
- Objective: support end-to-end AR/AP bookkeeping flows.
- Current status: **planned**.
- Main gaps: no invoice/bill entities or flows.
- Epics:
  - invoice lifecycle,
  - bill lifecycle,
  - payment reconciliation.
- Task ideas:
  - minimal invoice schema,
  - payment matching rules.
- Major risks: fragmented workflows and manual workarounds.
- Related technical spec: [Invoicing Minimal Lifecycle Technical Spec](../docs/architecture/INVOICING_MINIMAL_LIFECYCLE_SPEC.md).

### Explicit tickets (dependency-ordered)
1. **INV-MLC-001 — Invoice schema + RLS + rollback baseline**
   - Dependencies: existing company RBAC and active-company runtime path.
   - Acceptance checks:
     - migration introduces `sales_invoices`, `sales_invoice_lines`, and `invoice_events`,
     - decimal-only money fields and `(company_id, invoice_number)` uniqueness enforced,
     - rollback notes include pre-drop snapshot/export and reverse dependency order.
2. **INV-MLC-002 — Invoice API minimal lifecycle**
   - Dependencies: `INV-MLC-001`.
   - Acceptance checks:
     - `/api/invoices` create/list/detail and `issue/record-payment/void` actions implemented,
     - ownership fields are server-derived (client-supplied ownership rejected),
     - route tests cover valid and invalid status transitions.
3. **INV-MLC-003 — Audit/event immutability + integration tests**
   - Dependencies: `INV-MLC-002`.
   - Acceptance checks:
     - event append-only protections enforced in DB and API behavior,
     - integration tests validate cross-tenant denial and role constraints,
     - spec-linked test-plan section references executed commands/results.

## 8) VAT and tax engine
- Objective: Denmark-relevant VAT/tax calculations and review.
- Current status: **planned**.
- Main gaps: no VAT data model/rules/tests.
- Epics:
  - VAT category model,
  - calculation engine,
  - review and export outputs.
- Task ideas:
  - implement VAT rule table,
  - golden dataset test suite.
- Major risks: incorrect VAT outcomes.
- Related technical spec: [VAT Review Baseline Technical Spec](../docs/architecture/VAT_REVIEW_BASELINE_SPEC.md).

### Explicit tickets (dependency-ordered)
1. **VAT-RVW-001 — VAT review schema + RLS + rollback baseline**
   - Dependencies: `INV-MLC-001` and `ING-RECON-001` for source data alignment.
   - Acceptance checks:
     - migration introduces VAT code/run/review/event tables with company isolation,
     - global default VAT codes vs company overrides are explicitly handled,
     - rollback plan documents snapshot/replay validation for deterministic parity.
2. **VAT-RVW-002 — VAT preview/generate/review APIs**
   - Dependencies: `VAT-RVW-001`.
   - Acceptance checks:
     - `/api/vat/reviews/preview`, `/generate`, list/detail, and approve routes implemented,
     - explainability payload includes taxable-base and rate-source provenance,
     - unauthorized approve/mutation attempts are denied.
3. **VAT-RVW-003 — Golden dataset + deterministic regression coverage**
   - Dependencies: `VAT-RVW-002`.
   - Acceptance checks:
     - test fixtures include deterministic VAT periods and expected outputs,
     - repeated run with same input hash + engine version yields identical totals,
     - documented `Assumption`/`TODO` markers for unimplemented legal-form-specific logic.

## 9) Reports and exports
- Objective: produce reliable bookkeeping and tax support reports.
- Current status: **partial** (UI placeholders, limited summary logic).
- Main gaps: no formal report contracts or exports.
- Epics:
  - month/quarter/year reports,
  - VAT summary output,
  - accountant-friendly exports.
- Task ideas:
  - deterministic report query layer,
  - CSV/PDF export baseline.
- Major risks: decision-making based on inaccurate figures.

## 10) Integrations
- Objective: connect external systems safely.
- Current status: **partial**.
- As of 2026-03-27: CVR lookup adapter endpoint exists, while broader connectors/webhooks/jobs are still planned.
- Evidence: [`src/app/api/companies/cvr/route.ts`](../src/app/api/companies/cvr/route.ts), [`src/lib/cvr/adapter.ts`](../src/lib/cvr/adapter.ts).
- Main gaps: no broad connectors/webhooks/jobs.
- Epics:
  - bank provider integration,
  - document OCR provider,
  - accounting/export endpoints.
- Task ideas:
  - evaluate provider abstraction interface.
- Major risks: security and reliability issues at boundaries.

## 11) Security and operations
- Objective: harden data protection and operational readiness.
- Current status: **partial**.
- **As of:** 2026-03-29.
- Implemented baseline: explicit append-only `audit_events` table and immutability triggers exist, and incident/backup/restore operations runbooks are documented.
- Evidence: [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql), [`docs/ops/RESTORE_RUNBOOK.md`](../docs/ops/RESTORE_RUNBOOK.md), [`docs/ops/POST_RESTORE_VERIFICATION.md`](../docs/ops/POST_RESTORE_VERIFICATION.md), [`docs/ops/MIGRATION_ROLLBACK_SEQUENCE.md`](../docs/ops/MIGRATION_ROLLBACK_SEQUENCE.md), [`docs/ops/BACKUP_ASSUMPTIONS.md`](../docs/ops/BACKUP_ASSUMPTIONS.md), [`docs/ops/RELEASE_READINESS_CHECKLIST.md`](../docs/ops/RELEASE_READINESS_CHECKLIST.md).
- Main gaps: runbook execution cadence, recovery drill evidence, and incident-response maturity still need ongoing operational validation.
- Epics:
  - security review cadence,
  - audit-event architecture hardening,
  - ops runbook validation drills.
- Task ideas:
  - sensitive action logging coverage review,
  - recurring restore drill documentation with dated evidence.
- Major risks: compliance/security incidents.

## 12) UX polish and launch readiness
- Objective: ship low-friction workflows for Denmark-first users.
- Current status: **partial**.
- Main gaps: many pages are placeholder/mock-data-driven; missing legal-form branches.
- Epics:
  - task-focused UX iterations,
  - onboarding completion,
  - launch quality checklist.
- Task ideas:
  - replace remaining mock dashboards with real data,
  - add empty/error states and guided review workflows.
- Major risks: poor retention due to incomplete core loops.
