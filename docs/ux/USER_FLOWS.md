# User Flows (Current vs Target)

Related docs: [Product Module Map](../product/PRODUCT_MODULE_MAP.md), [Delivery Phases](../product/DELIVERY_PHASES.md), [PRD](../product/PRD.md), [API Contracts](../architecture/API_CONTRACTS.md).

Status labels:
- **Implemented**: supported by current code/API.
- **Partial**: some UI/API exists, but incomplete business flow.
- **Planned**: target workflow only.

## 1) Account onboarding and company setup (Module 1, 10)
- Trigger: first signup/login.
- Main steps:
  1. Create account and verify session.
  2. Open onboarding route.
  3. Enter business details and baseline settings.
  4. Continue into dashboard.
- User decisions: legal-form selection, VAT registration status, defer setup vs complete now.
- Edge cases: skipped onboarding, incomplete setup, missing company fields.
- Status: **Partial**.

## 2) Capture transaction and categorize (Module 4)
- Trigger: new business income/expense event.
- Main steps:
  1. Create transaction.
  2. Create/select category.
  3. Review summary totals.
- User decisions: category mapping, manual correction timing.
- Edge cases: uncategorized items, inconsistent categorization.
- Status: **Partial**.

## 3) Upload and process receipt (Module 5)
- Trigger: source document available.
- Main steps:
  1. Upload receipt image or PDF.
  2. Store privately and return metadata.
  3. Link to bookkeeping record (target: guided workflow).
- User decisions: link immediately vs queue for later.
- Edge cases: failed upload, unsupported file type, missing linkage.
- Status: **Implemented/Partial**.

## 4) Invoice-to-payment flow (Module 3, 6)
- Trigger: user needs to bill a customer.
- Main steps (target):
  1. Create quote or invoice.
  2. Send and track status.
  3. Record payment and reconcile.
- User decisions: due terms, reminders, accepted payment methods.
- Edge cases: partial payments, credits, overdue follow-up.
- Status: **Planned**.

## 5) Recurring billing management (Module 3)
- Trigger: repeated customer billing cadence.
- Main steps (target):
  1. Create schedule from template.
  2. Auto-generate invoices on interval.
  3. Pause/resume and review history.
- User decisions: frequency, auto-send, end-date policy.
- Edge cases: payment failure, skipped cycles, schedule drift.
- Status: **Planned**.

## 6) Reconciliation workbench (Module 5)
- Trigger: bank line import or statement upload.
- Main steps (target):
  1. Review incoming transactions.
  2. Accept suggested matches or post manually.
  3. Confirm reconciliation status.
- User decisions: accept suggestion vs override.
- Edge cases: duplicates, transfers, split transactions.
- Status: **Planned**.

## 7) Assistant task handling (Module 5, 12)
- Trigger: unresolved bookkeeping items or suggested actions.
- Main steps (target):
  1. Open dashboard task section.
  2. Review task reason and confidence.
  3. Apply or dismiss recommendation.
- User decisions: accept/reject suggestions, defer task.
- Edge cases: stale suggestions, conflicting recommendations.
- Status: **Planned**.

## 8) VAT period review (Module 4)
- Trigger: VAT reporting cycle.
- Main steps (target):
  1. Select period.
  2. Review VAT totals and transaction drilldowns.
  3. Resolve warnings.
  4. Submit or export filing package.
- User decisions: approve period values, correct source data.
- Edge cases: corrections after lock, mixed VAT treatment.
- Status: **Planned**.

## 9) Payroll run lifecycle (Module 7)
- Trigger: payroll period close.
- Main steps (target):
  1. Validate employee setup.
  2. Build draft payroll run.
  3. Review warnings and finalize.
  4. Generate payslips and bookkeeping outputs.
- User decisions: finalize vs reopen draft, correction handling.
- Edge cases: missing employee data, retro adjustments.
- Status: **Planned**.

## 10) Year-end readiness and filing support (Module 9)
- Trigger: fiscal year close.
- Main steps (target):
  1. Run readiness checks.
  2. Resolve missing items.
  3. Generate filing outputs.
  4. Complete advisor/support handoff as needed.
- User decisions: package path, advisor handoff timing.
- Edge cases: reopened records, unresolved discrepancies.
- Status: **Planned**.

## 11) Integration setup and monitoring (Module 8)
- Trigger: business needs external system sync.
- Main steps (target):
  1. Browse integration catalog.
  2. Connect app and grant access.
  3. Monitor sync jobs and error logs.
- User decisions: permission scope, retry/replay actions.
- Edge cases: auth expiry, mapping conflicts, failed sync batches.
- Status: **Planned**.

## 12) Dashboard daily operations loop (Module 12)
- Trigger: daily bookkeeping review.
- Main steps:
  1. Review KPIs and activity.
  2. Open tasks requiring action.
  3. Jump into invoicing, receipts, reconciliation, or VAT workflows.
- User decisions: prioritize tasks by due date and impact.
- Edge cases: KPI mismatch due to delayed processing.
- Status: **Partial** (layout exists; richer operational widgets are planned).
