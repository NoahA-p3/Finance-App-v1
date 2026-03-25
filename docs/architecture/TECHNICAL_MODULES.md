# Technical Module Boundaries

Related docs: [Product Module Map](../product/PRODUCT_MODULE_MAP.md), [Data Model](./DATA_MODEL.md), [API Contracts](./API_CONTRACTS.md), [System Overview](./SYSTEM_OVERVIEW.md).

This document maps the numbered product modules to technical ownership boundaries: schema domains, API resource groups, and implementation status.

Status labels:
- **Implemented**: present in current code and active runtime schema.
- **Partial**: some pieces exist; major pieces are still planned.
- **Planned**: documented target design.

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
- Current repo evidence: transaction/category primitives exist, but journal, VAT, and fixed-assets modules are planned.

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

## 8. Integrations and Developer Platform — **Planned**
- Schema domains: integration apps/connections, developer apps, OAuth clients, API keys, sync jobs/items/mappings/webhooks.
- API groups: `/integration-apps*`, `/companies/{company_id}/integration-connections*`, `/developer/*`.

## 9. Year-End, Tax Return, and Filing Help — **Planned**
- Schema domains: tax return packages/fields/instructions, annual accounts cases/tasks/outputs, advisor notes.
- API groups: `/companies/{company_id}/tax-return-packages*`, `/annual-accounts-cases*`.

## 10. Support, Onboarding, Learning, and Migration — **Partial**
- Schema domains: support tickets/messages/articles, migration cases/files/issues, onboarding checklists/tasks, learning courses/lessons.
- API groups: `/support/articles*`, `/companies/{company_id}/support-tickets*`, `/migration-cases*`, `/onboarding*`, `/learning/*`.

## 11. Financing and Partner Services — **Planned**
- Schema domains: financing partners/leads, consent records.
- API groups: `/financing/partners`, `/companies/{company_id}/financing-leads*`, `/companies/{company_id}/consents`.

## 12. Home Dashboard and Navigation — **Partial**
- Schema domains: dashboard preferences, activity events, dashboard snapshots.
- API groups: `/companies/{company_id}/dashboard*`, `/activity-events`.
- Current repo evidence: dashboard pages exist; broader KPI/task-backed resource model is planned.

## Implementation note
Current production code paths still center on auth + profile + transactions + categories + receipts. The broader schema and API structure in this document defines target technical boundaries for phased expansion.
