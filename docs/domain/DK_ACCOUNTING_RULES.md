# Danish Accounting Rules (Product/Engineering Guidance)

> This document is implementation guidance for product engineering, **not legal advice**.

Related docs: [DK VAT Rules](./DK_VAT_RULES.md), [Legal Form Rules](./LEGAL_FORM_RULES.md), [Data Model](../architecture/DATA_MODEL.md).

**Last verified:** 2026-03-29.

## Practical bookkeeping rules the product should respect
- Every financial event should map to a durable accounting record.
- Records must have traceable source documentation where required (receipt/invoice/voucher).
- Monetary values should be stored and processed with exact decimals.
- Corrections should preserve audit trail (reversal/adjustment), not destructive overwrite.

## Voucher and documentation expectations
- Keep a reference between transaction and supporting document (`receipts.path` currently available).
- Source docs should include date, counterparty, amount, and VAT relevance when possible.
- Missing documentation should be visibly flagged for review.

## Audit trail and traceability (current baseline)
- User attribution exists through auth context and actor fields.
- `created_at`/`occurred_at` timestamps are present on core posting/audit entities.
- Dedicated `audit_events` table exists with append-only mutation guards and company-scoped RLS.
- Posting/reversal APIs insert explicit audit events for key posting actions.

## Journal entry integrity (current baseline)
- Baseline posting model exists via `journal_entries` + `journal_lines`.
- `journal_entries.status` supports `draft` / `posted` / `reversed` with posted-state field constraints.
- Reversal linkage is supported (`reversal_of_journal_entry_id`) and single-reversal uniqueness is enforced.
- Source transactions with finalized postings are guarded from destructive mutation.

## Period locking and corrections (current baseline)
- `period_locks` table exists with company-scoped access control.
- Posting service checks lock ranges before posting/reversal operations.
- Closed-period edits are constrained through lock checks and append-only correction patterns.

## Remaining planned depth (separate from current baseline)
- Baseline is not yet a full compliance-grade accounting engine.
- Planned depth includes richer adjustment workflows, stricter close controls, and broader reporting-grade validation coverage.
- VAT/tax automation depth remains planned and should not be treated as complete.

## Financial records and retention expectations
- Receipt files are stored in private Supabase bucket with user-scoped access policies.
- **TODO:** define retention/archival policy and exportability requirements for long-term records.

## Legal form impacts on bookkeeping behavior
- Enkeltmandsvirksomhed:
  - owner and business finances are operationally close, but business bookkeeping still needs consistent separation.
- ApS:
  - stricter governance and clearer separation between company and owner transactions.
  - likely stronger requirements for year-end reporting and controls.
- **Status in code:** no legal-form-specific enforcement currently.

## Supported in current code vs planned depth

| Rule area | Current support | Status |
|---|---|---|
| Cross-tenant isolation | Company membership + RLS checks on scoped tables/routes | Implemented |
| Source document storage | Receipt upload + private storage policies | Partial |
| Decimal storage in DB | `numeric(12,2)` in finance/posting amounts | Implemented |
| Posted-state baseline | `journal_entries` status model + posted/reversed constraints | Implemented |
| Reversal controls | Reversal linkage + single-reversal uniqueness + service checks | Implemented |
| Period closing baseline | `period_locks` + posting-time lock checks | Implemented |
| Audit event log baseline | `audit_events` + append-only trigger guards | Implemented |
| Compliance-grade depth | Advanced controls/reporting breadth | Planned |

## Evidence pointers
- Posting service behaviors (posting, reversal, period-lock checks, audit inserts): `src/lib/postings/service.ts`.
- Posting schema, lock tables, state constraints, and append-only audit guards: `supabase/migrations/202603270002_posting_and_audit_immutability.sql`.
