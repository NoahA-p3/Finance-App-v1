# Product Module Map

Related docs: [PRD](./PRD.md), [Delivery Phases](./DELIVERY_PHASES.md), [User Flows](../ux/USER_FLOWS.md), [System Overview](../architecture/SYSTEM_OVERVIEW.md).
For Settings tab-level implementation clarity (tab status, persisted models, routes, placeholders), see [Settings Information Architecture](../architecture/SETTINGS_INFORMATION_ARCHITECTURE.md#settings-tab-readiness-matrix).

Status labels:
- **Implemented**: supported by current code paths and data model.
- **Partial**: some surfaces exist, but key behavior is incomplete.
- **Planned**: target capability only.

## Canonical module numbering (source of truth)
Use this numbering as the canonical product-module scheme across docs.

| Canonical module | Name |
|---|---|
| 1 | User and Company Management |
| 2 | Contacts and Master Data |
| 3 | Sales, Quotes, Orders, and Invoicing |
| 4 | Accounting Core |
| 5 | Receipts, Expenses, and Bookkeeping Automation |
| 6 | Payments and Checkout |
| 7 | Payroll |
| 8 | Integrations and Developer Platform |
| 9 | Year-End, Tax Return, and Filing Help |
| 10 | Support, Onboarding, Learning, and Migration |
| 11 | Financing and Partner Services |
| 12 | Home Dashboard and Navigation |


## Runtime evidence status table
**As of:** 2026-03-30 (cross-doc synchronized).

| Module | Status | Scope note | Runtime evidence |
|---|---|---|
| 1. User and Company Management | Partial | **API/runtime evidence only** (auth + company tenancy/RBAC endpoints and schema). | [`src/app/api/auth/*`](../../src/app/api/auth), [`src/app/api/companies/*`](../../src/app/api/companies), [`src/lib/company-permissions.ts`](../../src/lib/company-permissions.ts), [`202603250001_companies_bootstrap.sql`](../../supabase/migrations/202603250001_companies_bootstrap.sql), [`202603250002_company_rbac_baseline.sql`](../../supabase/migrations/202603250002_company_rbac_baseline.sql) |
| 2. Contacts and Master Data | Planned | **API/runtime evidence only** (no persisted contacts/products runtime module). | No contact/product API or table in `src/app/api/*`, `src/lib/*`, or `supabase/migrations/*`. |
| 3. Sales, Quotes, Orders, and Invoicing | Planned | **API/runtime evidence only** (invoice/quote/order runtime not present). | No invoice/quote/order API or table in `src/app/api/*`, `src/lib/*`, or `supabase/migrations/*`. |
| 4. Accounting Core | Partial | **API/runtime evidence only** (posting + reversal + period lock baseline; not full accounting depth). | [`src/app/api/transactions/route.ts`](../../src/app/api/transactions/route.ts), [`src/app/api/postings/route.ts`](../../src/app/api/postings/route.ts), [`src/app/api/postings/[posting_id]/reverse/route.ts`](../../src/app/api/postings/[posting_id]/reverse/route.ts), [`src/app/api/postings/period-locks/route.ts`](../../src/app/api/postings/period-locks/route.ts), [`src/lib/postings/service.ts`](../../src/lib/postings/service.ts), [`202603270002_posting_and_audit_immutability.sql`](../../supabase/migrations/202603270002_posting_and_audit_immutability.sql) |
| 5. Receipts, Expenses, and Bookkeeping Automation | Partial | **API/runtime evidence only** (receipt upload + company-shared finance baseline). | [`src/app/api/receipts/route.ts`](../../src/app/api/receipts/route.ts), [`src/app/api/transactions/route.ts`](../../src/app/api/transactions/route.ts), [`202603270001_company_shared_finance_rls.sql`](../../supabase/migrations/202603270001_company_shared_finance_rls.sql) |
| 6. Payments and Checkout | Planned | **API/runtime evidence only** (no checkout/payment orchestration module). | No payment checkout orchestration module in runtime evidence scope. |
| 7. Payroll | Planned | **API/runtime evidence only** (no payroll runtime API/schema). | No payroll API/table in runtime evidence scope. |
| 8. Integrations and Developer Platform | Partial | **Canonical interpretation: API/runtime evidence only** (CVR adapter counts as baseline integration; no marketplace/developer portal). | Minimal CVR adapter endpoint exists in [`src/app/api/companies/cvr/route.ts`](../../src/app/api/companies/cvr/route.ts) and [`src/lib/cvr/adapter.ts`](../../src/lib/cvr/adapter.ts); no marketplace/developer portal surfaces. |
| 9. Year-End, Tax Return, and Filing Help | Planned | **API/runtime evidence only** (no dedicated year-end filing runtime module). | No dedicated year-end/filing API or schema in runtime evidence scope. |
| 10. Support, Onboarding, Learning, and Migration | Planned | **Canonical interpretation: support/learning/migration API runtime only** (onboarding UI alone does not move this module above planned). | No support/learning/migration runtime module in evidence scope (`src/app/api/*`, `src/lib/*`, `supabase/migrations/*`). |
| 11. Financing and Partner Services | Planned | **API/runtime evidence only** (no partner-services runtime module). | No partner-services runtime module in evidence scope. |
| 12. Home Dashboard and Navigation | Partial | **UI + API/data composition** (persisted dashboard data exists; full cross-module orchestration remains incomplete). | Persisted dashboard data composition exists in [`src/lib/dashboard-data.ts`](../../src/lib/dashboard-data.ts); broad cross-module task orchestration remains unimplemented. |

## 1. User and Company Management
Includes account lifecycle, profile settings, business profile setup, and plan/entitlement control.

- Current repo status: **Partial**.
- As of 2026-03-30: auth, company bootstrap/switch, membership listing, invitation creation/listing, and tokenized invitation acceptance are implemented; full enterprise role depth remains incomplete.
- Evidence: [`src/app/api/auth/*`](../../src/app/api/auth), [`src/app/api/companies/*`](../../src/app/api/companies), [`src/lib/company-permissions.ts`](../../src/lib/company-permissions.ts), [`202603250002_company_rbac_baseline.sql`](../../supabase/migrations/202603250002_company_rbac_baseline.sql).

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
- As of 2026-03-30: transactions/categories plus posting/reversal/period-lock APIs and append-only audit/event constraints are implemented; VAT/tax engine remains planned.
- Evidence: [`src/app/api/transactions/route.ts`](../../src/app/api/transactions/route.ts), [`src/app/api/postings/route.ts`](../../src/app/api/postings/route.ts), [`src/lib/postings/service.ts`](../../src/lib/postings/service.ts), [`202603270002_posting_and_audit_immutability.sql`](../../supabase/migrations/202603270002_posting_and_audit_immutability.sql).

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

- Current repo status: **Partial**.
- As of 2026-03-30: CVR lookup integration adapter endpoint exists, but marketplace/developer-platform surfaces are not implemented.
- Evidence: [`src/app/api/companies/cvr/route.ts`](../../src/app/api/companies/cvr/route.ts), [`src/lib/cvr/adapter.ts`](../../src/lib/cvr/adapter.ts).

## 9. Year-End, Tax Return, and Filing Help
Includes year-end readiness workflows and filing-support workspaces.

- Current repo status: **Planned**.
- Today in repo: no dedicated year-end or filing assistant module.
- Planned extensions: readiness scoring, missing-item tracking, advisor handoff support.

## 10. Support, Onboarding, Learning, and Migration
Includes support entry points, guided onboarding, learning content, and migration intake.

- Current repo status: **Planned**.
- As of 2026-03-30: no support/help-center/migration API layer in runtime evidence scope; onboarding UX exists outside this table's evidence scope.
- Evidence scope note: table derived only from `src/app/api/*`, `src/lib/*`, and `supabase/migrations/*`.

## 11. Financing and Partner Services
Includes optional partner-services workflows (kept outside core bookkeeping navigation).

- Current repo status: **Planned**.
- Today in repo: no partner-services module.
- Planned extensions: consent-driven referral and lead tracking workflows.

## 12. Home Dashboard and Navigation
Includes financial overview widgets, action shortcuts, and cross-module task surfacing.

- Current repo status: **Partial**.
- As of 2026-03-30: dashboard finance summaries are built from persisted data, but broader action/task orchestration remains scaffold-level.
- Evidence: [`src/lib/dashboard-data.ts`](../../src/lib/dashboard-data.ts).

## Ownership guide (documentation)
- Product scope and phase intent: `docs/product/*`
- Interaction and flow detail: `docs/ux/*`
- Technical realization and constraints: `docs/architecture/*`
- Delivery sequence: `tasks/EPICS.md` and `docs/product/DELIVERY_PHASES.md`
