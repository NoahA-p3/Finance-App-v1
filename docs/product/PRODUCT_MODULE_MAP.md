# Product Module Map

Related docs: [PRD](./PRD.md), [Delivery Phases](./DELIVERY_PHASES.md), [User Flows](../ux/USER_FLOWS.md), [System Overview](../architecture/SYSTEM_OVERVIEW.md).

Status labels:
- **Implemented**: supported by current code paths and data model.
- **Partial**: some surfaces exist, but key behavior is incomplete.
- **Planned**: target capability only.

## 1. User and Company Management
Includes account lifecycle, profile settings, business profile setup, and plan/entitlement control.

- Current repo status: **Partial**.
- Today in repo: auth routes, middleware protection, and profile sync.
- Planned extensions: richer role model, company settings depth, session security features, plan controls.

## 2. Contacts and Master Data
Includes customer/supplier directory and reusable products/services catalog.

- Current repo status: **Planned**.
- Today in repo: no first-class contact or product module.
- Planned extensions: searchable directory, import/export, reusable line-item catalog.

## 3. Sales, Quotes, Orders, and Invoicing
Includes invoice lifecycle, quotes, recurring billing, and collections workflows.

- Current repo status: **Planned**.
- Today in repo: no invoice entities or invoice workflow UI.
- Planned extensions: invoice states, reminders, recurring schedules, credit notes, quote conversion.

## 4. Accounting Core
Includes chart of accounts, journal/ledger posting behavior, VAT/tax preparation, and financial reports.

- Current repo status: **Partial**.
- Today in repo: transaction/category primitives and reports scaffolding.
- Planned extensions: immutable posting model, VAT engine, tax workflow, period controls, stronger reporting depth.

## 5. Receipts, Expenses, and Bookkeeping Automation
Includes receipt inbox, expense posting workflows, reconciliation, and suggestion-driven assistance.

- Current repo status: **Partial**.
- Today in repo: receipt upload API and storage path; incomplete linking/automation loops.
- Planned extensions: OCR, reconciliation workbench, suggestion engine, guided task queue.

## 6. Payments and Checkout
Includes payment methods on invoices and payment state synchronization.

- Current repo status: **Planned**.
- Today in repo: no invoice payment method orchestration.
- Planned extensions: payment links, transaction status sync, partial-payment handling.

## 7. Payroll
Includes employee setup, payroll runs, payslips, and payroll-linked bookkeeping outputs.

- Current repo status: **Planned**.
- Today in repo: no payroll data model or payroll flows.
- Planned extensions: employee management, payroll runs, reporting outputs, posting integration.

## 8. Integrations and Developer Platform
Includes integration marketplace, API/developer access, sync monitoring, and mapping controls.

- Current repo status: **Planned**.
- Today in repo: no marketplace or developer portal surfaces.
- Planned extensions: connect/install flows, app credentials, sync logs, replay/retry controls.

## 9. Year-End, Tax Return, and Filing Help
Includes year-end readiness workflows and filing-support workspaces.

- Current repo status: **Planned**.
- Today in repo: no dedicated year-end or filing assistant module.
- Planned extensions: readiness scoring, missing-item tracking, advisor handoff support.

## 10. Support, Onboarding, Learning, and Migration
Includes support entry points, guided onboarding, learning content, and migration intake.

- Current repo status: **Partial**.
- Today in repo: onboarding route exists; guided support/migration flows are limited.
- Planned extensions: in-app help center entry, checklist progression, migration case tracking.

## 11. Financing and Partner Services
Includes optional partner-services workflows (kept outside core bookkeeping navigation).

- Current repo status: **Planned**.
- Today in repo: no partner-services module.
- Planned extensions: consent-driven referral and lead tracking workflows.

## 12. Home Dashboard and Navigation
Includes financial overview widgets, action shortcuts, and cross-module task surfacing.

- Current repo status: **Partial**.
- Today in repo: dashboard shell exists with scaffolded KPIs and report placeholders.
- Planned extensions: persisted KPIs, actionable task feed, cross-module operational visibility.

## Ownership guide (documentation)
- Product scope and phase intent: `docs/product/*`
- Interaction and flow detail: `docs/ux/*`
- Technical realization and constraints: `docs/architecture/*`
- Delivery sequence: `tasks/EPICS.md` and `docs/product/DELIVERY_PHASES.md`
