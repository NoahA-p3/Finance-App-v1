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

## Explicitly out of scope for stabilized MVP
- Full invoice/quote/order lifecycle
- Full double-entry ledger engine and period locking
- Automated bank sync and reconciliation engine
- Payroll, year-end filing workspace, and developer platform
- Compliance-grade VAT/tax automation
- External billing provider coupling (subscriptions remain internal-source in current MVP)

## Launch segment
- Denmark-based freelancers and very small businesses
- Legal forms targeted in docs: enkeltmandsvirksomhed and ApS

## Acceptance criteria (MVP baseline)
1. Users can authenticate and reach protected dashboard routes.
2. Users can create and review transactions and categories.
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
