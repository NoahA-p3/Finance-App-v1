# MVP Scope

Related docs: [Product Index](./README.md), [PRD](./PRD.md), [Product Module Map](./PRODUCT_MODULE_MAP.md), [Delivery Phases](./DELIVERY_PHASES.md), [System Overview](../architecture/SYSTEM_OVERVIEW.md), [Epics](../../tasks/EPICS.md).

## Scope intent
Define the MVP baseline that is either implemented today or required to stabilize before broader module expansion.

## In scope for MVP baseline
- Auth and protected route access
- Profile persistence
- Transaction and category primitives
- Receipt upload and secure storage
- Dashboard/reports scaffold with progressively real data
- Early onboarding and settings surfaces
- Internal plan/entitlement read path with server-enforced soft limits (monthly voucher counter + rolling turnover cap)

## Accounting-core boundary clarification (full ledger engine vs current runtime baseline)
**As of:** 2026-03-29.

### Already implemented in runtime baseline (posting/reversal/period locks)
- Posting create/list baseline exists for company-scoped journal activity.
- Reversal flow exists for posted records, preserving append-only correction behavior.
- Period lock create/list baseline exists.
- DB-level immutability and append-only audit-event constraints exist for posting/audit records.

File-level evidence pointers:
- Posting routes: [`src/app/api/postings/route.ts`](../../src/app/api/postings/route.ts), [`src/app/api/postings/[posting_id]/reverse/route.ts`](../../src/app/api/postings/[posting_id]/reverse/route.ts), [`src/app/api/postings/period-locks/route.ts`](../../src/app/api/postings/period-locks/route.ts)
- Posting service: [`src/lib/postings/service.ts`](../../src/lib/postings/service.ts)
- Journal/audit immutability migration: [`supabase/migrations/202603270002_posting_and_audit_immutability.sql`](../../supabase/migrations/202603270002_posting_and_audit_immutability.sql)
- Cross-check references: [`docs/product/PRODUCT_MODULE_MAP.md`](./PRODUCT_MODULE_MAP.md), [`docs/architecture/TECHNICAL_MODULES.md`](../architecture/TECHNICAL_MODULES.md), [`tasks/EPICS.md`](../../tasks/EPICS.md)

### Still excluded from “full ledger engine” scope
- Full chart-of-accounts strategy and deeper accounting controls beyond baseline posting/reversal/period-lock flows.
- Compliance-grade VAT/tax calculation and filing automation.
- Fixed-assets and broader accounting/reporting depth described in Module 4 target-state docs.

## Explicitly out of scope for stabilized MVP
- Full invoice/quote/order lifecycle
- Automated bank sync and reconciliation engine
- Payroll, year-end filing workspace, and developer platform
- Full ledger-engine completion beyond implemented posting/reversal/period-lock baseline
- External billing provider coupling (subscriptions remain internal-source in current MVP)

## Launch segment
- Denmark-based freelancers and very small businesses
- Legal forms targeted in docs: enkeltmandsvirksomhed and ApS

## Acceptance criteria (MVP baseline)
1. Users can authenticate and reach protected dashboard routes.
2. Users can create and review company-shared transactions and categories within their active company membership context.
3. Users can upload receipts into private storage paths.
4. Users can view period-oriented summaries from persisted data (not only mock values).
5. Tenant boundaries are enforced through auth and RLS.

## Phase alignment
- MVP baseline aligns with **Phase 1 foundation work** from [Delivery Phases](./DELIVERY_PHASES.md).
- Phase 2 and Phase 3 capabilities are documented as future work and must not be described as currently shipped.

## Gaps to close before MVP stabilization
- Stronger transaction validation and decimal-safe amount handling
- Clear receipt-linking workflow from upload to posting review
- Reduced mock-data dependency in dashboard/report pages
- Role/permission expansion plan beyond owner-only assumptions

## Assumptions
- **Assumption:** Next.js + Supabase remains the primary MVP runtime path.
- **Assumption:** Teams accept manual workflows in areas where deep automation is planned but not yet built.
