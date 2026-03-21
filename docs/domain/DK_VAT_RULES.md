# Danish VAT Rules (Product/Engineering Guidance)

> Product engineering guidance only, **not legal advice**.

Related docs: [DK Accounting Rules](./DK_ACCOUNTING_RULES.md), [MVP Scope](../product/MVP_SCOPE.md), [Golden Datasets](../testing/GOLDEN_DATASETS.md).

## VAT concepts relevant to this product
- VAT registration status impacts whether output/input VAT tracking applies.
- Sales and purchases can have different VAT treatment depending on category and context.
- Product should support VAT-aware bookkeeping and VAT review/report preparation.

## VAT treatments the system must support (target)
- Standard rated sales/purchases (baseline path).
- Zero-rated / exempt / outside-scope handling where relevant.
- Mixed deductibility scenarios for expenses.
- Credit note/refund adjustments to VAT position.

## Typical transaction categories and VAT expectations
- Revenue/invoice lines: usually output VAT when applicable.
- Supplier bills/expenses: input VAT potentially deductible.
- Non-deductible expenses: expense recognized without reclaiming VAT.
- Cross-border flows: **TODO domain validation required** before implementation.

## Filing-related needs to support (target)
- Period VAT summary view (output VAT, input VAT, net payable/refundable).
- Drill-down from VAT totals to underlying transactions/documents.
- Export/report format suitable for accountant or manual filing workflow.

## Edge cases and unknowns
- Partial VAT deduction logic by expense type.
- Reverse charge handling.
- Bad debt/credit-loss VAT adjustments.
- Currency conversion treatment when non-DKK transactions appear.
- Filing cadence differences by business profile.

## TODOs requiring domain validation
1. Validate exact VAT category taxonomy for MVP.
2. Confirm minimum VAT report fields needed for launch.
3. Define compliance-safe rounding policy for VAT calculations.
4. Confirm treatment rules for cross-border digital services.

## Current repository support vs gaps

| Area | Observed support | Status |
|---|---|---|
| VAT field in active transaction model | No explicit VAT columns in active `transactions` table | Planned |
| VAT in legacy migration branch | `receipts.vat` appears in `202603200004_finance_assistant_mvp.sql` | Partial/legacy |
| VAT UI/review flow | Not present | Planned |
| VAT tests | Not present | Planned |

**Assumption:** Current canonical schema is the later auth-user keyed tables (`transactions`, `receipts(path,user_id)`), not the older `users/accounts` branch.
