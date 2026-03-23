# PLANS.md

## Use this file when
Create or update a plan before coding for:
- backend logic
- migrations
- auth or permissions
- VAT, tax, or accounting logic
- receipt upload or storage changes
- replacing mock-backed flows with persisted flows
- multi-file refactors

---

## Plan template

### Title
Short task name.

### Goal
What should change.

### Current behavior
What the repo does today.
Reference the exact files and docs reviewed.

### Proposed approach
How the change will work.
Keep it concrete and aligned with current architecture.

### Affected files
List expected code, docs, migration files, and generated type files.

### Risks
Call out:
- schema ambiguity
- auth or RLS risk
- API contract drift
- decimal precision risk
- mock versus persisted data confusion
- legal-form or VAT rule assumptions

### Verification
List exact commands and any manual checks.

### Test coverage
State:
- tests added
- tests updated
- missing harness or fixture gaps
- golden datasets that should apply

### Notes
Assumptions, open questions, and follow-up work.
