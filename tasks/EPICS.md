# EPICS Roadmap (Prioritized)

Status labels: **implemented**, **partial**, **planned**, **unknown**.

Related docs: [PRD](../docs/product/PRD.md), [System Overview](../docs/architecture/SYSTEM_OVERVIEW.md), [Test Strategy](../docs/testing/TEST_STRATEGY.md).

## Runtime status table (module → status)
**As of:** 2026-03-27.

| Module | Status | Evidence |
|---|---|---|
| 1) Repo and developer foundation | partial | Baseline scripts/docs exist; CI/test depth still limited in repo. |
| 2) Accounting domain model | partial | Transaction/category primitives are live, but full legal-form-aware canonical model is incomplete. [`src/app/api/transactions/route.ts`](../src/app/api/transactions/route.ts), [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql) |
| 3) Auth, tenancy, and roles | partial | Auth, company membership, role permissions, and invitation list/create are present; full invitation acceptance and richer role rollout remain open. [`src/app/api/companies/invitations/route.ts`](../src/app/api/companies/invitations/route.ts), [`src/lib/company-permissions.ts`](../src/lib/company-permissions.ts), [`supabase/migrations/202603250002_company_rbac_baseline.sql`](../supabase/migrations/202603250002_company_rbac_baseline.sql) |
| 4) Ledger core | partial | Posting, reversal, period locks, and immutability guards are implemented baseline; deeper accounting completeness still planned. [`src/app/api/postings/route.ts`](../src/app/api/postings/route.ts), [`src/app/api/postings/[posting_id]/reverse/route.ts`](../src/app/api/postings/%5Bposting_id%5D/reverse/route.ts), [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql) |
| 5) Transaction ingestion | partial | Manual transaction API insert/list exists; import/matching engine absent. [`src/app/api/transactions/route.ts`](../src/app/api/transactions/route.ts) |
| 6) Document capture | partial | Receipt upload/list API and storage constraints exist; OCR/linking UX depth is incomplete. [`src/app/api/receipts/route.ts`](../src/app/api/receipts/route.ts), [`supabase/migrations/202603200004_finance_assistant_mvp.sql`](../supabase/migrations/202603200004_finance_assistant_mvp.sql) |
| 7) Invoicing and bills | planned | No invoice/bill runtime API or schema in evidence scope. |
| 8) VAT and tax engine | planned | No VAT/tax rule engine implementation in evidence scope. |
| 9) Reports and exports | partial | Persisted dashboard/report summary logic exists; formal report/export contracts remain limited. [`src/lib/dashboard-data.ts`](../src/lib/dashboard-data.ts) |
| 10) Integrations | partial | Minimal CVR lookup adapter exists; broad connector/webhook/job platform is not implemented. [`src/app/api/companies/cvr/route.ts`](../src/app/api/companies/cvr/route.ts), [`src/lib/cvr/adapter.ts`](../src/lib/cvr/adapter.ts) |
| 11) Security and operations | partial | Audit-event append-only table and immutability triggers exist; broader incident/restore ops runbooks are still limited. [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql) |
| 12) UX polish and launch readiness | partial | Many production loops are still scaffold-level; persisted data has replaced some prior placeholders. [`src/lib/dashboard-data.ts`](../src/lib/dashboard-data.ts) |

## 1) Repo and developer foundation
- Objective: maintain reliable engineering baseline and documentation.
- Current status: **partial**.
- Main gaps:
  - no automated tests,
  - no CI definition visible,
  - schema direction ambiguity across migrations.
- Epics:
  - docs-as-source-of-truth completion,
  - baseline quality gate setup,
  - migration governance rules.
- Task ideas:
  - add test runner and minimal smoke tests,
  - add migration README with rollback plan template.
- Major risks: drift between docs, schema, and runtime behavior.

## 2) Accounting domain model
- Objective: establish canonical accounting model for Denmark use cases.
- Current status: **planned/partial** (single transaction table exists).
- Main gaps: no ledger posting model, no legal-form-aware data model.
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
- As of 2026-03-27, implemented baseline:
  - company tenancy API surface exists under `src/app/api/companies/*` (company profile CRUD, company switch, members, and invitations list/create),
  - permission helpers and role checks exist in `src/lib/company-permissions.ts`,
  - foundational schema + RLS are in migrations `202603250001_companies_bootstrap.sql` and `202603250002_company_rbac_baseline.sql`.
- Evidence: [`src/app/api/companies/route.ts`](../src/app/api/companies/route.ts), [`src/app/api/companies/switch/route.ts`](../src/app/api/companies/switch/route.ts), [`src/app/api/companies/members/route.ts`](../src/app/api/companies/members/route.ts), [`src/app/api/companies/invitations/route.ts`](../src/app/api/companies/invitations/route.ts), [`src/lib/company-permissions.ts`](../src/lib/company-permissions.ts), [`supabase/migrations/202603250001_companies_bootstrap.sql`](../supabase/migrations/202603250001_companies_bootstrap.sql), [`supabase/migrations/202603250002_company_rbac_baseline.sql`](../supabase/migrations/202603250002_company_rbac_baseline.sql).
- Main gaps:
  - invitation lifecycle is not end-to-end (acceptance/onboarding flow still missing),
  - role model is still baseline-first and needs a richer, production-ready matrix across advanced roles.
- Epics:
  - invitation acceptance and membership activation flow,
  - richer role matrix and permission policy hardening,
  - auth flow hardening and tenancy integration test coverage.
- Task ideas:
  - implement invitation acceptance endpoint + UI handoff,
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
- As of 2026-03-27: explicit append-only `audit_events` table and immutability triggers exist, but incident response/backup runbook maturity is still limited.
- Evidence: [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../supabase/migrations/202603270002_posting_and_audit_immutability.sql).
- Main gaps: no incident/restore docs, unknown backup runbook.
- Epics:
  - security review cadence,
  - audit-event architecture hardening,
  - ops runbooks.
- Task ideas:
  - sensitive action logging coverage review,
  - restore drill documentation.
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
