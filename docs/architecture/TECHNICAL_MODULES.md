# Technical Module Boundaries

Related docs: [Product Module Map](../product/PRODUCT_MODULE_MAP.md), [Data Model](./DATA_MODEL.md), [API Contracts](./API_CONTRACTS.md), [System Overview](./SYSTEM_OVERVIEW.md).

This document maps the numbered product modules to technical ownership boundaries: schema domains, API resource groups, and implementation status.

Status labels:
- **Implemented**: present in current code and active runtime schema.
- **Partial**: some pieces exist; major pieces are still planned.
- **Planned**: documented target design.

## Technical status table (aligned to product modules)
**As of:** 2026-03-29 (cross-doc synchronized).

| Product module | Technical status | Scope note | Technical evidence summary |
|---|---|---|---|
| 1. User and Company Management | Partial | **API/runtime evidence only** (auth + tenancy/RBAC backend baseline). | Auth/company routes and RBAC migrations exist; deeper billing/role depth remains planned. |
| 2. Contacts and Master Data | Planned | **API/runtime evidence only** (target boundaries only). | No active contacts/products runtime schema or API families implemented. |
| 3. Sales, Quotes, Orders, and Invoicing | Planned | **API/runtime evidence only** (target boundaries only). | No active sales-document runtime schema or API families implemented. |
| 4. Accounting Core | Partial | **API/runtime evidence only** (posting/reversal/period-lock/audit baseline). | Posting routes + service + immutability migration are implemented; VAT/fixed-assets/reporting depth is still planned. |
| 5. Receipts, Expenses, and Bookkeeping Automation | Partial | **API/runtime evidence only** (receipt upload baseline, broader automation planned). | Receipt upload/list runtime path exists; reconciliation/rules/suggestions families remain planned. |
| 6. Payments and Checkout | Planned | **API/runtime evidence only** (target boundaries only). | No payment-provider/payment-link runtime implementation yet. |
| 7. Payroll | Planned | **API/runtime evidence only** (target boundaries only). | No payroll runtime schema or API implementation yet. |
| 8. Integrations and Developer Platform | Partial | **Canonical interpretation: API/runtime evidence only** (CVR adapter counts as minimal implemented integration baseline). | Minimal CVR integration endpoint/adapter exists; broader connection/job/developer platform remains planned. |
| 9. Year-End, Tax Return, and Filing Help | Planned | **API/runtime evidence only** (target boundaries only). | No year-end/tax-return runtime implementation yet. |
| 10. Support, Onboarding, Learning, and Migration | Planned | **Canonical interpretation: support/learning/migration API runtime only** (onboarding UI flow by itself does not satisfy this technical module). | Support/migration/learning API families and schema domains remain target design. |
| 11. Financing and Partner Services | Planned | **API/runtime evidence only** (target boundaries only). | No financing/partner-services runtime implementation yet. |
| 12. Home Dashboard and Navigation | Partial | **UI + API/data composition** (dashboard data composition exists; richer dashboard domain model/API families remain planned). | Dashboard pages and persisted data composition exist; full dashboard snapshots/activity resource model is still target-state. |

## 1. User and Company Management — **Partial**
- Schema domains: identity/session, memberships/roles, companies/settings, plans/subscriptions.
- API groups: `/auth/*`, `/me*`, `/companies/*`, `/billing/*`, `/permissions`.
- Current repo evidence: signup/login/logout routes exist; broader company, role, and billing resources are planned.

## 2. Contacts and Master Data — **Planned**
- Schema domains: contacts, contact people/addresses/tags, products, price lists.
- API groups: `/companies/{company_id}/contacts*`, `/companies/{company_id}/products*`, `/companies/{company_id}/price-lists*`.

## 3. Sales, Quotes, Orders, and Invoicing — **Planned**
- Schema domains: `sales_documents`, lines, attachments, events, quote approvals, recurring schedules, reminders, collection cases.
- API groups: `/companies/{company_id}/sales-documents*`, `/companies/{company_id}/recurring-schedules*`, `/companies/{company_id}/collections*`.

## 4. Accounting Core — **Partial**
- Schema domains: fiscal periods, accounts, journal entries/lines, cashbook/posting templates/import jobs, VAT returns, reports, fixed assets.
- API groups: `/companies/{company_id}/accounts*`, `/journal-entries*`, `/fiscal-periods*`, `/vat-*`, `/reports*`, `/fixed-assets*`.
- **As of:** 2026-03-29.
- Current repo evidence: posting/journal baseline is implemented (create/list postings, reverse postings, period locks, and audit-event writes) while VAT and fixed-assets modules are still planned.
- Evidence (file-level):
  - Posting API routes: `src/app/api/postings/route.ts`, `src/app/api/postings/[posting_id]/reverse/route.ts`, `src/app/api/postings/period-locks/route.ts`.
  - Posting + audit service logic: `src/lib/postings/service.ts`.
  - Journal/audit schema and immutability guards: `supabase/migrations/202603270002_posting_and_audit_immutability.sql`.

## 5. Receipts, Expenses, and Bookkeeping Automation — **Partial**
- Schema domains: files, receipt extraction, file links, expenses/allocations, bank sync/reconciliation, rules/suggestions/tasks.
- API groups: `/companies/{company_id}/files*`, `/receipt-inbox`, `/expenses*`, `/bank-*`, `/reconciliation`, `/automation-rules*`, `/suggestions*`, `/assistant-tasks*`.
- Current repo evidence: receipt upload route exists; remaining resource families are planned.

## 6. Payments and Checkout — **Planned**
- Schema domains: payment provider accounts, payment links, payment transactions.
- API groups: `/companies/{company_id}/payment-provider-accounts*`, `/sales-documents/{document_id}/payment-*`, `/payments/webhooks/*`.

## 7. Payroll — **Planned**
- Schema domains: employees and compensation profiles, payroll runs, payslips/lines, liabilities, submission logs.
- API groups: `/companies/{company_id}/employees*`, `/payroll-runs*`, `/payslips*`, `/payroll-liabilities`.

## 8. Integrations and Developer Platform — **Partial**
- Schema domains: integration apps/connections, developer apps, OAuth clients, API keys, sync jobs/items/mappings/webhooks.
- API groups: `/integration-apps*`, `/companies/{company_id}/integration-connections*`, `/developer/*`.
- Current repo evidence: minimal CVR integration endpoint/adapter exists; broader integration platform surface remains planned.

## 9. Year-End, Tax Return, and Filing Help — **Planned**
- Schema domains: tax return packages/fields/instructions, annual accounts cases/tasks/outputs, advisor notes.
- API groups: `/companies/{company_id}/tax-return-packages*`, `/annual-accounts-cases*`.

## 10. Support, Onboarding, Learning, and Migration — **Planned**
- Schema domains: support tickets/messages/articles, migration cases/files/issues, onboarding checklists/tasks, learning courses/lessons.
- API groups: `/support/articles*`, `/companies/{company_id}/support-tickets*`, `/migration-cases*`, `/onboarding*`, `/learning/*`.
- Canonical scope note: status is based on support/learning/migration API and schema runtime evidence, not onboarding UI presence alone.

## 11. Financing and Partner Services — **Planned**
- Schema domains: financing partners/leads, consent records.
- API groups: `/financing/partners`, `/companies/{company_id}/financing-leads*`, `/companies/{company_id}/consents`.

## 12. Home Dashboard and Navigation — **Partial**
- Schema domains: dashboard preferences, activity events, dashboard snapshots.
- API groups: `/companies/{company_id}/dashboard*`, `/activity-events`.
- Current repo evidence: dashboard pages exist; broader KPI/task-backed resource model is planned.

## Implementation note
Current production code paths still center on auth + profile + transactions + categories + receipts. The broader schema and API structure in this document defines target technical boundaries for phased expansion.
