# Finance Assistant MVP

Finance Assistant is a Next.js + Supabase accounting web app aimed at freelancers and small businesses in Denmark.

> Current product state: early MVP foundation. Auth, profile, transaction/category/receipt data paths, and dashboard/report persisted-data views exist. Danish accounting and VAT domain depth is mostly planned.

**Last verified:** 2026-03-29.

## What the app does (current)
- User signup/login/logout with Supabase Auth.
- Forgot/reset password flow via Supabase Auth recovery email.
- Optional verification email resend flow for unverified signups.
- Session management API (`GET /api/me/sessions`, `DELETE /api/me/sessions/{session_id}`) with ownership enforcement.
- Account security APIs for profile summary, device history, login activity alerts, and MFA TOTP management (`/api/me/account`, `/api/me/devices`, `/api/me/login-alerts`, `/api/me/mfa/*`).
- Login alerts are currently implemented as in-app account alerts derived from authenticated session activity; no separate outbound notification service is wired in this MVP yet.
- Protected dashboard routes via Next.js middleware.
- Basic profile record sync in `public.profiles`.
- Transaction CRUD surface (currently list + create via `/api/transactions`).
- Category browse/create/delete via `/api/categories` (`GET`, `POST`, `DELETE`).
- Receipt upload + persisted inbox metadata listing via `/api/receipts` (`POST` upload, `GET` active-company receipt rows).
- Receipt upload validation enforces allowed MIME types (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`), a 10 MB max file size limit, unsafe filename rejection, and normalized object keys under `user_id/company_id/<uuid>.<ext>`.
- Company bootstrap/profile API (`/api/companies`) with persisted onboarding/settings fields (name, contact/address, VAT status, fiscal year start, base currency).
- Company bootstrap RLS policy supports creator read access during first-company creation so owner membership + settings inserts can complete in one onboarding flow.
- Company RBAC baseline with seeded roles (`owner`, `staff`, `read_only`), server-enforced permission checks on settings/member management, and invitation lifecycle endpoints (`GET/POST /api/companies/invitations`, `POST /api/companies/invitations/accept`, `GET/PATCH /api/companies/members`).
- Company context switching via `POST /api/companies/switch`, persisted in `profiles.active_company_id`, and exposed in dashboard top navigation.
- Company settings persistence now includes invoice settings, branding/logo metadata placeholders, branch/department placeholders, and CVR number storage.
- CVR lookup adapter endpoint (`GET /api/companies/cvr?cvr=<8-digit>`) with explicit manual fallback when provider integration is not configured.
- Finance APIs (`/api/transactions`, `/api/categories`, `/api/receipts`) are active-company scoped and enforce membership + `company_id` isolation with **company-shared** row visibility inside the same company.
- Finance mutation permissions are explicitly keyed: `finance.transactions.write`, `finance.receipts.write`, `finance.postings.write`, and `finance.period_locks.manage` (seeded to baseline `owner` + `staff`; not seeded to `read_only`).
- Posting APIs (`/api/postings`, `/api/postings/{posting_id}/reverse`, `/api/postings/period-locks`) provide append-only journal posting, reversal traceability, and period lock enforcement.
- Posted transaction records are protected against destructive update/delete by database-level immutability guards; corrections are made through reversal flows.
- Internal billing baseline includes plans/subscriptions/entitlements (`/api/entitlements`) and server-side soft-limit enforcement on transaction writes for monthly vouchers + rolling 12-month turnover cap.
- Dashboard/reporting pages currently read persisted company-scoped data via `src/lib/dashboard-data.ts` (`transactions`, `categories`, `company_settings.base_currency`) and compute KPI/trend/breakdown outputs server-side.

## Tech stack (observed in repo)
- Next.js `15.2.6` + React `19` + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Zod (installed)
- Custom reusable SVG chart primitives (no external charting dependency)
- Vercel as intended hosting target

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Set required variables (no secrets committed):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (present in env example; currently not directly consumed in app code)
  - `NEXT_PUBLIC_SITE_URL` (**recommended for auth email links**; must match an allowed Supabase Auth redirect URL such as `https://app.example.com`)
  - `NEXT_PUBLIC_ENABLE_PASSWORD_RESET` (optional, set to `false` to hide/reset-disable password recovery UX)
  - `NEXT_PUBLIC_ENABLE_SESSION_MANAGEMENT` (optional, set to `false` to hide the Settings session-management panel while backend remains available)
  - `NEXT_PUBLIC_ENABLE_ADVANCED_ROLES` (optional, default `false`; when `true`, allows assigning advanced placeholder roles: accountant, auditor, payroll-only, sales-only, integration-admin)
  - `NEXT_PUBLIC_ENABLE_ENTITLEMENTS` (optional, default `true`; controls Settings plan/entitlements panel visibility)
  - `NEXT_PUBLIC_ENABLE_SETTINGS_AUTOMATION` (optional, default `true`; set to `false` to hide Automation settings tab)
  - `NEXT_PUBLIC_ENABLE_SETTINGS_PAYROLL` (optional, default `true`; set to `false` to hide Payroll settings tab)
  - `NEXT_PUBLIC_ENABLE_SETTINGS_DEVELOPER` (optional, default `true`; set to `false` to hide Developer settings tab)
  - `NEXT_PUBLIC_ENABLE_SETTINGS_SECURITY_AUDIT` (optional, default `true`; set to `false` to hide Security & Audit settings tab)
  - `ENABLE_ENTITLEMENT_ENFORCEMENT` (optional, default `true`; global server-side plan-limit enforcement switch)
  - `ENABLE_ENTITLEMENT_ENFORCEMENT_PLAN_KEYS` (optional CSV allowlist; e.g. `starter,growth` for per-tier rollout)
4. Start dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.


## Onboarding hygiene expectations
- Local dependency/build artifacts are expected to remain untracked (`node_modules/`, `.next/`, `out/`, `dist/`, `coverage/`, caches, and editor artifacts).
- Local environment files must stay local (`.env`, `.env.local`, `.env.*`), except `.env.example`, which is intentionally tracked.
- Run this quick hygiene check after local install/build activity:
  ```bash
  npm install
  npm run build
  git status --short
  ```
- Expected outcome: only intentional tracked-file edits appear in `git status --short`; dependency/build outputs should not appear.

## Scripts
- `npm run dev` — start local dev server
- `npm run lint` — Next.js lint
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — production build
- `npm run start` — run built app
- `npm run test` — run Node test suite (`node --test tests/*.test.js`)
- `npm run deadcode:audit-dashboard-components` — import-graph audit from `src/app/**` into legacy dashboard component scopes

## Dead-code import audit process
- Run `npm run deadcode:audit-dashboard-components` before major dashboard refactors and at least once per sprint to catch stale component paths early.
- The audit traverses imports from `src/app/**` and verifies reachability into:
  - `src/components/dashboard/*`
  - `src/components/dashboard-ui/*`
- Legacy files retired on 2026-03-27 were moved to:
  - `archive/components/retired-dashboard-2026-03-27/`
  - `archive/components/retired-dashboard-ui-2026-03-27/`
- If you intentionally reintroduce one of these archived components, move it back into `src/components/**` and rerun lint/typecheck/build in the same PR.


## Documentation verification policy
- Major docs should include a **Last verified** date.
- Update that date when claims are re-checked against current repository evidence (code, migrations, scripts).
- If evidence is incomplete, mark the statement as **Assumption** or **TODO**.

### Documentation consistency checklist (include in same PR as feature changes)
- [ ] Updated status docs when runtime behavior changed: `tasks/EPICS.md`, `docs/product/PRODUCT_MODULE_MAP.md`, and `AGENTS.md`.
- [ ] If posting, reversal, period-lock, journal, or audit-event behavior changed, updated all three alignment docs together: `docs/security/SECURITY_RULES.md`, `docs/architecture/TECHNICAL_MODULES.md`, and `tasks/EPICS.md`.
- [ ] Added an explicit **As of: YYYY-MM-DD** date in every updated status section.
- [ ] Added direct evidence links to changed claims (prefer `src/app/api/*`, `src/lib/*`, `supabase/migrations/*`).
- [ ] If docs and runtime evidence still disagree, documented the gap explicitly in the PR summary.

## Current automated test coverage and limitations
- `npm run test` executes Node built-in tests under `tests/*.test.js`.
- Current tests focus on repository contract checks (API/migration/source assertions), not full live integration behavior.
- No e2e browser test suite is currently wired in package scripts.
- Use `npm run lint` + `npm run typecheck` as baseline quality checks for all changes.

## Explicit placeholders still remaining
- **Settings tabs:** multiple settings tabs intentionally render placeholder guidance until backed by persisted feature models.
- **Invitation acceptance:** tokenized invite acceptance is implemented via onboarding handoff (`/onboarding?invite=<token>`) and `POST /api/companies/invitations/accept`.
- **VAT engine:** VAT/tax automation engine remains planned and is not fully implemented in this repository.

## Supabase and database
- SQL migrations: `supabase/migrations/`
- Migration execution order runbook: `supabase/migrations/MIGRATION_ORDER.md`
  - Includes tie-break rule: when timestamp prefixes are equal (for example, `202603290001_*`), apply migrations in lexicographic **full-filename** order.
- Generated DB type file: `src/types/database.ts`
- Apply migrations (Supabase CLI):
  ```bash
  supabase db push
  ```

## Repository structure
- `src/app/(auth)` — login/signup/forgot-password/reset-password routes
- `src/app/(dashboard)` — protected app sections (dashboard, transactions, receipts, reports, settings, onboarding, with `/account` redirect compatibility)
- `src/app/api` — route handlers for auth, profile sessions, companies, transactions, categories, receipts
- `src/components` — UI and feature components
- `archive/components` — retired non-runtime component references kept for historical context
- `src/lib` — auth helper, Supabase clients, data-fetch helpers
- `supabase/migrations` — schema, triggers, RLS/storage policy definitions
- `docs/` — product, domain, architecture, testing, security, UX docs
- `tasks/EPICS.md` — prioritized implementation roadmap

## Documentation map
- Product index: `docs/product/README.md`
- Product core docs: `docs/product/PRD.md`, `docs/product/PRODUCT_MODULE_MAP.md`, `docs/product/DELIVERY_PHASES.md`, `docs/product/MVP_SCOPE.md`
- Domain: `docs/domain/DK_ACCOUNTING_RULES.md`, `docs/domain/DK_VAT_RULES.md`, `docs/domain/LEGAL_FORM_RULES.md`
- Architecture: `docs/architecture/SYSTEM_OVERVIEW.md`, `docs/architecture/DATA_MODEL.md`, `docs/architecture/API_CONTRACTS.md`, `docs/architecture/POSTING_IMMUTABILITY_SPEC.md`, `docs/architecture/ENGINEER_ONBOARDING_GUIDE.md`, `docs/architecture/SETTINGS_INFORMATION_ARCHITECTURE.md`
- Testing: `docs/testing/TEST_STRATEGY.md`, `docs/testing/GOLDEN_DATASETS.md`
- Security: `docs/security/SECURITY_RULES.md`
- UX: `docs/ux/USER_FLOWS.md`
- Roadmap: `tasks/EPICS.md`
- Agent instructions: `AGENTS.md`


## Product module coverage (docs)
Documentation is structured around 12 product modules (user/company management through dashboard/navigation) plus phased delivery priorities.

- Module boundaries and status: `docs/product/PRODUCT_MODULE_MAP.md`
- Delivery phases and priority outcomes: `docs/product/DELIVERY_PHASES.md`
- User journeys across modules: `docs/ux/USER_FLOWS.md`

## Working with Codex in this repo
- Read `AGENTS.md` first.
- Ground any claim in code/migrations/docs already present.
- For unknown details, mark as **Assumption** or **TODO**, do not invent.
- If changing schema/API/workflow, update corresponding docs in the same PR.

## Deployment notes
- Intended deployment target is Vercel.
- No `vercel.json` is currently present; deployment relies on framework defaults + configured env vars.
- Ensure Supabase Auth URL settings include the deployed app domain and redirect URLs (signup/resend/reset use this allow-list).
- If signup fails with a redirect-configuration message, set `NEXT_PUBLIC_SITE_URL` and add the exact URL to Supabase Auth redirect settings.
