# PRD — Finance Assistant

Related docs: [Product Index](./README.md), [Product Module Map](./PRODUCT_MODULE_MAP.md), [Delivery Phases](./DELIVERY_PHASES.md), [System Overview](../architecture/SYSTEM_OVERVIEW.md), [User Flows](../ux/USER_FLOWS.md).

## Product summary
Finance Assistant is a Denmark-focused bookkeeping and accounting platform for freelancers and small businesses.

The current repository is an MVP foundation. It already includes authentication, protected routing, profile sync, transaction/category/receipt primitives, and dashboard/report scaffolding. Many advanced accounting workflows are still planned.

## Target users
- Freelancers and sole proprietors
- Small teams and small companies
- Legal forms currently prioritized in product scope: enkeltmandsvirksomhed and ApS
- Users who need compliant bookkeeping workflows with low operational friction

## Product goals
1. Make daily bookkeeping fast and understandable.
2. Preserve traceability from source document to accounting output.
3. Support period review workflows (monthly, VAT period, and year-end).
4. Expand from MVP primitives into a full accounting operations platform in phased delivery.

## Product principles
- **Clarity first:** workflows should expose why an action is needed.
- **Traceability by default:** accounting-relevant records should remain auditable.
- **Progressive automation:** suggestions and helpers should be explainable and reviewable.
- **Scope honesty:** planned modules are documented as planned until implemented.

## Module scope and status
The product roadmap is organized into numbered modules for traceability:

**As of:** 2026-03-30 (cross-doc synchronized).

1. User and company management — **Partial**
2. Contacts and master data — **Planned**
3. Sales, quotes, orders, and invoicing — **Planned**
4. Accounting core — **Partial**
5. Receipts, expenses, and bookkeeping automation — **Partial**
6. Payments and checkout — **Planned**
7. Payroll — **Planned**
8. Integrations and developer platform — **Partial**
9. Year-end, tax return, and filing help — **Planned**
10. Support, onboarding, learning, and migration — **Planned**
11. Financing and partner services — **Planned**
12. Home dashboard and navigation — **Partial**

See [Product Module Map](./PRODUCT_MODULE_MAP.md) for detailed boundaries and ownership.

Changed status evidence (runtime paths):
- **Module 8 (Partial):** minimal integration baseline exists via CVR endpoint and adapter in `src/app/api/companies/cvr/route.ts` and `src/lib/cvr/adapter.ts`.
- **Module 10 (Planned):** no support/learning/migration runtime module in canonical evidence scope (`src/app/api/*`, `src/lib/*`, `supabase/migrations/*`).

## Current implementation baseline (repo-verified)
- Auth lifecycle (signup/login/logout) and protected routes
- Profile persistence linked to authenticated users
- Transaction/category/receipt primitives
- Dashboard and report scaffolding (partly placeholder-driven)

## Phased delivery priorities
- **Phase 1:** foundational bookkeeping credibility
- **Phase 2:** accounting-platform parity workflows (reconciliation, recurring, integrations)
- **Phase 3:** advanced retention modules (payroll, filing support, developer platform)

See [Delivery Phases](./DELIVERY_PHASES.md) for capability breakdown.

## Non-goals for this product-doc pass
- Full schema specification for all modules
- Full REST/API contract documentation for all planned capabilities
- Legal advice or unsupported statutory claims

## Key risks and constraints
- Canonical runtime schema and legacy artifacts still require careful convergence.
- Some UI sections remain mock/placeholder-heavy and should not be presented as production-complete.
- VAT/tax and legal-form-specific logic are roadmap areas and require deeper domain implementation.

## Open documentation questions
1. Which module-specific docs should be split first as implementation accelerates (invoicing, reconciliation, or VAT)?
2. What release criteria define “Phase 1 complete” for PM/design/engineering sign-off?
3. Which workflows need explicit persona variants (owner, employee, accountant) in future docs?
