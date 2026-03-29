# Legal Form Rules — Enkeltmandsvirksomhed vs ApS

> Product guidance for engineering. Not legal advice.

Related docs: [PRD](../product/PRD.md), [DK Accounting Rules](./DK_ACCOUNTING_RULES.md), [User Flows](../ux/USER_FLOWS.md).

**Last verified:** 2026-03-29.

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
- **Status:** legal-form-specific enforcement is still planned.

## Shared vs differentiated flows
- Shared (current and target): transaction capture, receipt attachment, category management, monthly review.
- Differentiated (target): year-end workflows, approval controls, role permissions, certain report templates.

## Data model implications
### Current baseline (implemented)
- Company tenancy abstraction exists via `companies` + `company_memberships` + company-scoped `company_id` finance tables.
- Invitations and acceptance flow exist as part of membership lifecycle.
- Active-company context is persisted on profiles and used in runtime auth/data access flow.

### Legal-form-specific depth (planned)
- Add explicit legal-form field(s) and enforce form-driven behavior.
- Add legal-form-aware role/workflow/reporting differences where required.
- Add year-end state/checklist records keyed by legal form.

## Current codebase support summary
- **Implemented baseline:** organization/tenancy abstraction beyond per-user ownership is present through company + membership modeling.
- **Not yet implemented:** legal-form-specific behavior and rule enforcement for enkeltmandsvirksomhed vs ApS.

## Evidence pointers
- Company tenancy and membership baseline: `supabase/migrations/202603250001_companies_bootstrap.sql`, `supabase/migrations/202603250002_company_rbac_baseline.sql`.
- Active-company and company-scoped finance alignment: `supabase/migrations/202603250003_active_company_and_company_scoped_finance.sql`.
- Invitation acceptance API and lifecycle baseline: `src/app/api/companies/invitations/accept/route.ts`, `supabase/migrations/202603290001_company_invitation_acceptance_flow.sql`.
