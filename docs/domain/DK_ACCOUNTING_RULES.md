# Danish Accounting Rules (Product/Engineering Guidance)

> This document is implementation guidance for product engineering, **not legal advice**.

Related docs: [DK VAT Rules](./DK_VAT_RULES.md), [Legal Form Rules](./LEGAL_FORM_RULES.md), [Data Model](../architecture/DATA_MODEL.md).

## Practical bookkeeping rules the product should respect
- Every financial event should map to a durable accounting record.
- Records must have traceable source documentation where required (receipt/invoice/voucher).
- Monetary values should be stored and processed with exact decimals.
- Corrections should preserve audit trail (reversal/adjustment), not destructive overwrite.

## Voucher and documentation expectations
- Keep a reference between transaction and supporting document (`receipts.path` currently available).
- Source docs should include date, counterparty, amount, and VAT relevance when possible.
- Missing documentation should be visibly flagged for review.

## Audit trail and traceability
- User attribution exists today through `user_id` and auth context.
- `created_at` timestamps are present on core tables.
- **Gap:** No dedicated immutable audit-event table yet.
- **Gap:** No explicit “posted” state or locking semantics on transactions.

## Journal entry integrity
- Current model is single-record `transactions` table (`type`, `amount`, etc.), not double-entry journal.
- For compliance-grade robustness, planned model should support:
  - immutable posted entries,
  - balanced debits/credits,
  - reversal postings.
- **Status:** Planned; not implemented.

## Period locking and corrections
- Current state: no period table, close state, or lock policy in schema.
- Planned behavior:
  - close accounting periods,
  - block destructive edits in closed periods,
  - allow correction via dated reversal/adjustment entries.

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

## Supported in current code vs missing

| Rule area | Current support | Status |
|---|---|---|
| Per-user data isolation | RLS and auth checks on core tables/routes | Implemented |
| Source document storage | Receipt upload + storage policies | Partial |
| Decimal storage in DB | `numeric(12,2)` columns in migrations | Implemented |
| Immutable posting model | No posted/reversal mechanism | Planned |
| Period closing | No lock model | Planned |
| Audit event log | No dedicated table | Planned |
