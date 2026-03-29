# Engineer Onboarding Guide (Evidence-Based)

This guide is for engineers new to the repository and focuses on what is implemented in code today.

**Last verified:** 2026-03-29.

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
- Company members/invitations baseline, including acceptance lifecycle via token + authenticated user checks.

Still planned or partial:
- VAT/tax engine automation.
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

## 4) Explicit placeholders and partial areas to keep in mind

1. **Settings tabs placeholders**
   - Multiple tabs intentionally render placeholder cards (banking/payments, integrations, automation, payroll, developer, security/audit).
   - `sales-documents` and `accounting-tax` also contain explicit transitional/placeholder guidance.

2. **Invitation workflows are now additive but still maturing**
   - Team access APIs support listing + creating pending invitations.
   - Acceptance route is implemented at `src/app/api/companies/invitations/accept/route.ts`.
   - Acceptance persistence/status lifecycle is implemented in `supabase/migrations/202603290001_company_invitation_acceptance_flow.sql`.
   - Remaining depth (still planned): richer invitation lifecycle UX and broader multi-user role workflow coverage.

3. **VAT engine planned**
   - Accounting & Tax settings copy explicitly states VAT engine and tax-rule automation are TODO/planned.

---

## 5) Updated evidence pointers for core claims

- Invitation acceptance API boundary and result handling: `src/app/api/companies/invitations/accept/route.ts`.
- Invitation acceptance token/status lifecycle and `accept_company_invitation(...)`: `supabase/migrations/202603290001_company_invitation_acceptance_flow.sql`.
- Posting baseline with reversal + period-lock checks + audit inserts: `src/lib/postings/service.ts`.
- Posting schema, period locks, posted-state checks, and append-only audit guardrails: `supabase/migrations/202603270002_posting_and_audit_immutability.sql`.

---

## 6) Testing commands and scope limitations (actual)

**As of:** 2026-03-29.

Available commands:
- `npm run test` -> `node --test tests/*.test.js`
- `npm run test:integration:local` -> boots local Supabase, applies migrations via reset, then runs Node test files under `tests/integration/*.test.js`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Current automated test scope limitations:
- Tests in `tests/*.test.js` are mostly contract/static assertions over source files and migrations.
- Integration runtime coverage exists via the local Supabase harness in `npm run test:integration:local` for suites in `tests/integration/*.test.js`.
- PR CI (`.github/workflows/pr-ci.yml`) conditionally runs the **Integration (Supabase local)** job when integration-impacting paths change or when the PR has the `ci:full-integration` label.
- No e2e browser suite is wired in scripts.
- As a result, passing fast contract tests indicates repo-contract consistency, while integration confidence depends on the conditional integration gate.

For broader testing policy and coverage expectations, see [docs/testing/TEST_STRATEGY.md](../testing/TEST_STRATEGY.md).

---

## 7) Recommended first read order

1. `README.md`
2. `docs/architecture/SYSTEM_OVERVIEW.md`
3. `docs/architecture/DATA_MODEL.md`
4. `docs/architecture/API_CONTRACTS.md`
5. `docs/security/SECURITY_RULES.md`
6. `docs/testing/TEST_STRATEGY.md`
7. Relevant API routes and `src/lib/*` for your area

---

## 8) High-risk areas for contributors

- Extending legacy/divergent schema artifacts instead of canonical runtime path.
- Using float math for money handling.
- Destructive edits where append-only/reversal behavior is expected.
- Missing membership/permission checks on company-scoped endpoints.
- Presenting placeholders as production-complete implementations.
