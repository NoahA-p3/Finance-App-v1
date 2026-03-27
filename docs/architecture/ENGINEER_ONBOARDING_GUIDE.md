# Engineer Onboarding Guide (Evidence-Based)

This guide is for engineers new to the repository and focuses on what is implemented in code today.

**Last verified:** 2026-03-27.

## Last-verified policy
- Keep this date synchronized with the latest evidence review for this file.
- Update it whenever claims here are re-validated against repository code, migrations, and scripts.
- Mark any unclear point as **Assumption** rather than presenting it as implemented.

---

## 1) Product state at a glance

Current MVP capabilities implemented in repo evidence:
- Supabase auth (signup/login/logout/forgot/reset/resend verification).
- Protected dashboard route group and middleware gating.
- Profile + company context and active company switching.
- Company-scoped transactions, categories, receipts, and posting/reversal APIs.
- Company members/invitations baseline (pending invitation management).

Still planned or partial:
- VAT/tax engine automation.
- Invitation acceptance flow.
- Several settings tabs that are intentionally placeholder-level.

---

## 2) Runtime path you should treat as canonical

Identity and tenancy:
- `auth.users` -> `public.profiles` identity projection.
- Company membership controls data access.
- Finance data is company-scoped (`company_id`) rather than per-user-only rows.

Auth and route gating:
- `src/middleware.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/auth.ts`

API entrypoints:
- `src/app/api/*`

---

## 3) Dashboard and Reports data source (current evidence)

Dashboard and reports are no longer mock-backed in the active route pages:
- `src/app/(dashboard)/dashboard/page.tsx` and `src/app/(dashboard)/reports/page.tsx` both call `getDashboardFinanceData(...)`.
- `src/lib/dashboard-data.ts` reads persisted rows from:
  - `transactions` by `company_id`,
  - `categories` by `company_id`,
  - `company_settings.base_currency`.
- KPI totals, trend chart points, expense breakdown, and recent transactions are derived server-side from persisted data.

---

## 4) Explicit placeholders to keep in mind

1. **Settings tabs placeholders**
   - Multiple tabs intentionally render placeholder cards (banking/payments, integrations, automation, payroll, developer, security/audit).
   - `sales-documents` and `accounting-tax` also contain explicit transitional/placeholder guidance.

2. **Invitation acceptance missing**
   - Team access UI and invitation APIs support listing + creating pending invitations.
   - Acceptance flow is explicitly called out as not implemented yet.

3. **VAT engine planned**
   - Accounting & Tax settings copy explicitly states VAT engine and tax-rule automation are TODO/planned.

---

## 5) Testing commands and scope limitations (actual)

Available commands:
- `npm run test` -> `node --test tests/*.test.js`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Current automated test scope limitations:
- Tests are mostly contract/static assertions over source files and migrations.
- There is no full integration harness for live Supabase interactions in this repo.
- No e2e browser suite is wired in scripts.
- As a result, passing tests indicates repo-contract consistency, not full runtime behavioral coverage.

---

## 6) Recommended first read order

1. `README.md`
2. `docs/architecture/SYSTEM_OVERVIEW.md`
3. `docs/architecture/DATA_MODEL.md`
4. `docs/architecture/API_CONTRACTS.md`
5. `docs/security/SECURITY_RULES.md`
6. `docs/testing/TEST_STRATEGY.md`
7. Relevant API routes and `src/lib/*` for your area

---

## 7) High-risk areas for contributors

- Extending legacy/divergent schema artifacts instead of canonical runtime path.
- Using float math for money handling.
- Destructive edits where append-only/reversal behavior is expected.
- Missing membership/permission checks on company-scoped endpoints.
- Presenting placeholders as production-complete implementations.
