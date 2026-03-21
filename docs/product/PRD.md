# PRD — Finance Assistant MVP

## Product summary
Finance Assistant aims to make daily bookkeeping simple for Danish freelancers and small businesses, especially users without accounting expertise.

Current repo state is an MVP foundation with authentication, profile management, transaction/category/receipt primitives, and dashboard scaffolding.

## Target users
- Freelancers and solo operators
- Small businesses in Denmark
- Legal forms in scope: enkeltmandsvirksomhed and ApS
- Users who need compliant records but want low-friction workflows

## Jobs to be done
1. Capture income/expense events quickly.
2. Keep receipts and source documentation linked to entries.
3. Categorize transactions with minimal manual effort.
4. Track VAT/tax exposure over time.
5. Produce period and year-end reporting outputs.

## Product principles
- Fast daily use over deep accounting complexity.
- Safe defaults for compliance-sensitive areas.
- Explainable automation (especially categorization/VAT suggestions).
- Strong audit trail; no silent destructive edits.

## Core requirements

| Requirement | Status | Evidence / notes |
|---|---|---|
| Authenticated user accounts | Implemented | Supabase Auth API routes and middleware protection are present. |
| Basic profile persistence | Implemented | `public.profiles` table + trigger + RLS exist. |
| Transaction capture and retrieval | Partial | `GET/POST /api/transactions` exists, but no journal/period controls. |
| Category management | Partial | Create/delete categories exists; no taxonomy governance yet. |
| Receipt upload and storage | Partial | Upload API + private bucket policies exist; OCR/extraction missing. |
| Danish VAT engine | Planned | VAT fields/rules are not modeled in active tables. |
| Tax and deduction guidance | Planned | No tax rule engine in code. |
| Compliance-grade reporting | Planned | Reports page is currently UI placeholders/mock values. |
| Legal-form specific flows (enkeltmandsvirksomhed/ApS) | Planned | No legal-form-specific model/logic observed. |

## Success metrics (MVP)
- Time to add and categorize a transaction < 30 seconds.
- ≥ 90% of records have supporting source references where required.
- Zero cross-tenant data leaks (RLS/auth correctness).
- VAT-ready monthly review flow available (target state; not yet implemented).

## Constraints
- Keep architecture simple (Next.js + Supabase).
- No heavy ops burden before product-market validation.
- Domain behavior must align with Danish accounting requirements (as product guidance, not legal advice).

## Non-goals (current MVP)
- Payroll processing.
- Multi-entity consolidated accounting.
- Advanced ERP/inventory modules.
- Fully automated statutory filing submission.

## Risks
- Current transaction model is single-entry style; not a full ledger.
- Money is represented as JS `number` in TypeScript layer (precision risk).
- Existing migrations include parallel schema directions (`public.users/accounts` vs auth-user keyed tables), creating drift risk.
- Limited automated test coverage for finance-critical logic.

## Open questions
1. Canonical accounting model: evolve current transaction table or introduce double-entry journal tables?
2. Canonical user/business ownership model: continue direct `auth.users` reference or introduce organizations/tenancy tables?
3. Which VAT filing outputs are required in v1 (human-readable summary vs export formats)?
4. What minimum year-end outputs are required per legal form?
