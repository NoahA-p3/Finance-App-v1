# MVP Scope

Related docs: [PRD](./PRD.md), [System Overview](../architecture/SYSTEM_OVERVIEW.md), [Epics](../../tasks/EPICS.md).

## In scope
- Email/password auth and account access control.
- Basic profile setup and updates.
- Create and list transactions.
- Basic category CRUD.
- Receipt upload and secure storage.
- Basic dashboard/reports UI scaffold.

## Out of scope (for current codebase)
- Full double-entry ledger with posting controls.
- Automated bank integrations.
- OCR extraction and auto-reconciliation.
- VAT return filing output automation.
- End-to-end year-end closing workflows for both legal forms.

## Launch segment
- Denmark-based solo freelancers first.
- Secondary segment: very small ApS businesses with simple bookkeeping needs.

## Assumptions
- **Assumption:** Product intends Supabase-only backend for MVP (no separate API service).
- **Assumption:** Initial users can tolerate partial/manual accounting workflows before full compliance automation.

## Acceptance criteria (MVP target)
1. User can sign up, log in, and access protected dashboard routes.
2. User can add transactions and categorize them.
3. User can upload and link receipts to transactions.
4. User can review period totals (revenue/expense) from persisted data.
5. Multi-user isolation enforced via RLS.

## Milestone view
1. Foundation: auth, schema, app shell. (mostly present)
2. Core bookkeeping: transaction + category + receipt flows. (partial)
3. Compliance layer: VAT/tax rules and period controls. (planned)
4. Reporting and launch hardening: exports, tests, ops/security. (planned)

## Current repo status vs target MVP

| Area | Current | Target MVP | Gap |
|---|---|---|---|
| Auth and access | Implemented | Stable | Small hardening + tests |
| Transactions | Partial | Production-ready flow | Validation, edit/reversal policy, safer money handling |
| Categories | Partial | Production-ready flow | Stronger constraints and UX integration |
| Receipts | Partial | Production-ready flow | Linking workflow, metadata extraction, error handling |
| VAT/tax | Planned | Minimum Denmark-ready review | Data model + rule implementation |
| Reports | Placeholder-heavy | Data-backed summaries | Reporting queries and exports |
| Tests | Minimal/none | Targeted automated coverage | Add unit/integration/e2e suites |
