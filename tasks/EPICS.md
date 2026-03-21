# EPICS Roadmap (Prioritized)

Status labels: **implemented**, **partial**, **planned**, **unknown**.

Related docs: [PRD](../docs/product/PRD.md), [System Overview](../docs/architecture/SYSTEM_OVERVIEW.md), [Test Strategy](../docs/testing/TEST_STRATEGY.md).

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
- Current status: **partial** (owner-only via RLS).
- Main gaps: no business entity, no memberships/roles.
- Epics:
  - business tenancy tables,
  - role matrix and permission checks,
  - auth flow hardening.
- Task ideas:
  - add organization + membership migrations,
  - permission integration tests.
- Major risks: unauthorized access if expanded without rigorous RLS.

## 4) Ledger core
- Objective: implement immutable posting and correction model.
- Current status: **planned**.
- Main gaps: no journal lines, no reversal semantics, no period locks.
- Epics:
  - posting engine,
  - reversal/correction flow,
  - close-period controls.
- Task ideas:
  - introduce journal tables,
  - add posted/unposted state machine.
- Major risks: compliance and trust failures if edits remain mutable.

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
- Current status: **planned**.
- Main gaps: no connectors/webhooks/jobs.
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
- Main gaps: no explicit audit logs, no incident/restore docs, unknown backup runbook.
- Epics:
  - security review cadence,
  - audit-event architecture,
  - ops runbooks.
- Task ideas:
  - sensitive action logging table,
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
  - replace mock dashboards with real data,
  - add empty/error states and guided review workflows.
- Major risks: poor retention due to incomplete core loops.
