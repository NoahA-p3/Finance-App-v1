# Legal Form Rules — Enkeltmandsvirksomhed vs ApS

> Product guidance for engineering. Not legal advice.

Related docs: [PRD](../product/PRD.md), [DK Accounting Rules](./DK_ACCOUNTING_RULES.md), [User Flows](../ux/USER_FLOWS.md).

## Key differences relevant to product behavior

| Area | Enkeltmandsvirksomhed | ApS |
|---|---|---|
| Entity separation | Owner-operated; practical separation still needed | Strong legal separation between owner and company |
| Governance expectations | Simpler operationally | Typically stricter controls/documentation |
| Permissions model | Often single-user first | Higher likelihood of multi-user roles |
| Year-end complexity | Generally simpler | Generally more formal reporting/approval needs |

## Onboarding implications
- Shared flow:
  - collect business identity basics,
  - VAT registration status,
  - accounting period preferences.
- Form-specific branching (target):
  - legal form selection,
  - role/permission setup defaults,
  - year-end checklist differences.

## Tax surfaces and reporting implications
- Both forms need reliable income/expense and VAT tracking.
- ApS likely needs stricter owner/company transaction separation checks.
- Enkeltmandsvirksomhed may need owner-withdrawal-aware categorization guidance.
- **Status:** none of this is codified yet in current schema/API.

## Shared vs differentiated flows
- Shared (current and target): transaction capture, receipt attachment, category management, monthly review.
- Differentiated (target): year-end workflows, approval controls, role permissions, certain report templates.

## Data model implications (target)
- Add `businesses` (or equivalent) with `legal_form` enum.
- Add membership/role tables for multi-user access.
- Tag transactions/reporting logic with business context.
- Add year-end state/checklist records keyed by legal form.

## Current codebase support
- No legal form field in schema.
- No organization/tenancy abstraction beyond per-user ownership.
- No role matrix beyond authenticated user and RLS ownership checks.

**Status summary:** legal-form-specific behavior is **planned**, not implemented.
