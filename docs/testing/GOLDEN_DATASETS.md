# Golden Datasets for Accounting Regression

Purpose: define deterministic business scenarios for future automated regression tests.

> Status: specification only; datasets are not yet encoded in test fixtures.

Related docs: [Test Strategy](./TEST_STRATEGY.md), [DK Accounting Rules](../domain/DK_ACCOUNTING_RULES.md), [DK VAT Rules](../domain/DK_VAT_RULES.md).

## Dataset 1 — Freelancer, not VAT registered
- Business setup:
  - legal form: enkeltmandsvirksomhed
  - VAT: not registered
- Transactions/events:
  - 3 revenue transactions
  - 5 expense transactions
  - 3 receipts attached, 2 missing
- Expected outputs:
  - VAT totals remain zero/not-applicable
  - monthly P/L totals match raw amounts
  - missing document flags for 2 expenses
- Verifies:
  - non-VAT path,
  - receipt completeness checks,
  - basic reporting totals

## Dataset 2 — Freelancer, VAT registered
- Business setup:
  - legal form: enkeltmandsvirksomhed
  - VAT: registered
- Transactions/events:
  - revenue with VAT-bearing sales
  - expenses with deductible VAT
- Expected outputs:
  - output VAT > 0
  - input VAT > 0
  - net VAT payable/refundable computed deterministically
- Verifies:
  - VAT calculation pipeline,
  - VAT review report consistency

## Dataset 3 — Sole proprietor mixed deductibility
- Business setup:
  - enkeltmandsvirksomhed, VAT registered
- Transactions/events:
  - mix of deductible and non-deductible expense types
- Expected outputs:
  - deductible VAT applied only to eligible items
  - non-deductible items do not inflate reclaimable VAT
- Verifies:
  - category-to-tax rule mapping,
  - edge handling for deductions

## Dataset 4 — Single-owner ApS
- Business setup:
  - legal form: ApS
  - one owner user, optional accountant user (future role test)
- Transactions/events:
  - capitalized startup costs and normal operations
- Expected outputs:
  - reports filtered to company entity only
  - permission model prevents non-member access
- Verifies:
  - legal form branch,
  - tenancy/permission controls

## Dataset 5 — Invoice, bill, refund, reversal scenario
- Business setup:
  - VAT registered business
- Transactions/events:
  - invoice issued and paid
  - supplier bill recorded and paid
  - customer refund
  - reversal of wrongly posted expense
- Expected outputs:
  - net revenue/expense reflects refund and reversal correctly
  - audit trail keeps original + reversal entries
- Verifies:
  - posting integrity,
  - reversal semantics,
  - report correctness after corrections

## Dataset 6 — Failed bank match
- Business setup:
  - business with imported bank transactions (future feature)
- Transactions/events:
  - one imported transaction cannot be matched confidently
- Expected outputs:
  - record remains in review queue
  - no automatic posting to finalized ledger state
- Verifies:
  - safe automation fallback behavior

## Dataset 7 — Locked period scenario
- Business setup:
  - prior month marked closed (future feature)
- Transactions/events:
  - user attempts to edit closed-period transaction
  - user posts reversal in current period
- Expected outputs:
  - direct edit blocked
  - reversal accepted and linked
- Verifies:
  - period lock enforcement,
  - correction workflow

## Dataset 8 — Year-end (enkeltmandsvirksomhed)
- Business setup:
  - full fiscal year data for sole proprietor
- Transactions/events:
  - normal operations + year-end adjustments
- Expected outputs:
  - year summary report generated
  - carry-forward balances validated (if model includes balances)
- Verifies:
  - year-end flow for sole proprietors

## Dataset 9 — Year-end (ApS)
- Business setup:
  - full fiscal year data for ApS
- Transactions/events:
  - operations + year-end adjustments + governance checks
- Expected outputs:
  - company-focused year-end reports
  - stricter completion checklist items satisfied
- Verifies:
  - ApS-specific year-end workflow branch

## Implementation notes
- Use fixed timestamps and deterministic IDs.
- Keep amounts in decimal-safe format (string/decimal type in test fixtures).
- Include expected report snapshots for regression comparison.
