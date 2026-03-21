# User Flows (Current vs Target)

Related docs: [PRD](../product/PRD.md), [MVP Scope](../product/MVP_SCOPE.md), [API Contracts](../architecture/API_CONTRACTS.md).

Status labels:
- **Implemented**: supported by current code/API.
- **Partial**: some UI/API exists, but incomplete business flow.
- **Planned**: not yet implemented.

## 1) Onboarding
- Trigger: first login/signup completion.
- Main steps:
  1. Open onboarding page.
  2. Enter business info.
  3. VAT registered toggle.
  4. Bank connection placeholder.
- User decisions: legal form (target), VAT status.
- Edge cases: user skips onboarding, incomplete setup.
- Status: **Partial** (multi-step UI placeholder exists, no persisted onboarding model).

## 2) Connect bank or import transactions
- Trigger: user wants automatic transaction ingestion.
- Main steps (target): choose provider/import method, authenticate, map accounts, preview imported transactions.
- User decisions: which account to connect, import window.
- Edge cases: auth failure, duplicate imports, unsupported bank format.
- Status: **Planned** (only placeholder text in onboarding/settings).

## 3) Upload receipt or bill
- Trigger: user has source document.
- Main steps:
  1. Select file.
  2. Upload to `/api/receipts`.
  3. Receive receipt id/path.
- User decisions: attach now vs later.
- Edge cases: unsupported type, oversized file, upload failure.
- Status: **Implemented/Partial** (upload API exists; linking workflow in UI is incomplete).

## 4) Categorize transaction
- Trigger: transaction requires category assignment.
- Main steps (current/target): create categories, apply to transactions, review uncategorized list.
- User decisions: choose existing vs new category.
- Edge cases: deleting category in use, conflicting category semantics.
- Status: **Partial** (category create/delete API exists; no full transaction categorization UX loop).

## 5) Create invoice
- Trigger: user issues invoice to customer.
- Main steps (target): create invoice, set VAT treatment, send/share, track status.
- User decisions: due date, VAT, reminder behavior.
- Edge cases: credit note, partial payment.
- Status: **Planned**.

## 6) Record payment
- Trigger: incoming/outgoing payment event.
- Main steps (target): link payment to invoice/bill/transaction, update status, post accounting impact.
- User decisions: full vs partial settlement.
- Edge cases: over/under payment, duplicate payment.
- Status: **Planned**.

## 7) Monthly review
- Trigger: month-end reconciliation routine.
- Main steps (target): resolve uncategorized/missing receipt items, verify totals, close month.
- User decisions: accept/reject suggestions, postpone unresolved items.
- Edge cases: late-arriving documents, corrections after review.
- Status: **Partial** (dashboard/reports UI exists but is mostly mock).

## 8) VAT review
- Trigger: VAT period closing workflow.
- Main steps (target): inspect output/input VAT, review exceptions, generate filing-ready summary.
- User decisions: approve VAT summary, mark items for correction.
- Edge cases: mixed deductibility, refunds/reversals.
- Status: **Planned**.

## 9) Year-end flow (enkeltmandsvirksomhed)
- Trigger: fiscal year close.
- Main steps (target): finalize records, run year-end checks, generate required outputs.
- User decisions: adjustment entries, final approval.
- Edge cases: late adjustments, reopened period requests.
- Status: **Planned**.

## 10) Year-end flow (ApS)
- Trigger: fiscal year close for ApS.
- Main steps (target): stricter close checklist, approvals, report package generation.
- User decisions: authorization/approver steps.
- Edge cases: governance and permission exceptions.
- Status: **Planned**.
