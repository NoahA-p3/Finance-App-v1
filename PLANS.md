# PLANS.md

## Onboarding company bootstrap RLS fix (March 28, 2026)

### Goal
Fix onboarding company creation failure where minimal required input can hit an RLS violation on `public.companies`.

### Current behavior
- `POST /api/companies` inserts into `public.companies`, then `public.company_memberships`, then `public.company_settings`.
- Existing `company_memberships` insert policy validates the target company via an `exists` subquery on `public.companies`.
- `public.companies` select policy currently requires existing membership, which is not yet present during bootstrap.
- Result: first-time onboarding can fail with an RLS error while creating the initial company.

### Proposed approach
- Add an additive migration that broadens the companies select policy to also allow `created_by = auth.uid()` for authenticated users.
- Keep ownership checks intact for updates and for membership insertion (`role='owner'`, `user_id=auth.uid()`, company must be created by auth user).
- No API contract changes; route handler behavior remains the same.

### Affected files
- `supabase/migrations/<new>_companies_bootstrap_rls_fix.sql`
- `README.md` (brief behavior note for bootstrap policy)
- `PLANS.md`

### Risks
- Policy broadening could unintentionally expand read scope if implemented incorrectly.
- Environments with drifted policy names could miss replacement unless migration explicitly drops/recreates expected policy.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- Assumption: canonical runtime path remains `auth.users -> profiles -> companies/company_memberships/company_settings`.
- Open question: should we add automated Supabase integration tests for onboarding bootstrap RLS to prevent regression?


## Backend gap-closure plan (March 23, 2026)

### Goal
Stabilize the MVP backend on a single canonical schema and hardened API boundaries so persisted finance flows can replace mock-heavy dashboard behavior safely.

### Current behavior
- Runtime backend uses Next.js route handlers in `src/app/api/*` with Supabase server client and owner-scoped queries against `public.transactions`, `public.categories`, and `public.receipts`.
- Auth uses Supabase Auth with middleware/session refresh and `requireUser()` server guard.
- DB has a canonical auth-user keyed path (`auth.users -> public.profiles` + finance tables) **and** a divergent legacy migration branch (`public.users`, `public.accounts`, alternate transactions/receipts columns).
- Dashboard/reports/transactions UI remain mostly mock-data backed despite existing API routes.
- Money is stored as `numeric(12,2)` in SQL, but TypeScript uses `number` and summary math currently uses JS number reductions.

### Top 5 backend priorities
1. **Schema convergence and drift removal (highest risk reducer).**
   - Define canonical migration path and deprecate or isolate legacy `public.users/accounts` branch.
   - Add explicit migration/recovery notes and confirm generated DB types align.
2. **Harden API input contracts for finance endpoints.**
   - Replace raw body spreading in transaction insert path with explicit field validation + allowlist.
   - Enforce server-derived ownership fields and safe defaults at route boundaries.
3. **Wire dashboard/reports to persisted data path.**
   - Replace mock-data finance widgets with server-fetched summaries/transaction data from canonical tables.
   - Keep placeholder features clearly labeled where parity is incomplete.
4. **Introduce decimal-safe domain computation layer.**
   - Prevent float-based accounting aggregates in app logic (report totals, summaries, future VAT/tax rules).
   - Add deterministic fixtures for revenue/expense calculations.
5. **Security and auditability hardening for compliance-sensitive flows.**
   - Add explicit tests/checks for auth isolation, RLS assumptions, and receipt access boundaries.
   - Define append-only correction model (reversal/adjustment) before adding edit-heavy finance features.

### Single highest leverage next implementation slice
**Slice:** Canonical schema alignment pass + API contract hardening for `/api/transactions` (boundary validation + explicit insert payload) with docs/type synchronization.

**Why this slice:**
- It reduces immediate security/data-integrity risk from accepting unchecked request payloads.
- It creates a safer foundation for replacing mock UI with persisted flows.
- It forces resolution of schema/documentation drift that currently risks building against the wrong model.

**Implementation decision for this task:**
- **Not implemented in this pass.**
- Reason: this slice spans migrations/types/API/docs and is not low-risk “small and bounded” until schema branch decisions are finalized.

### Proposed approach (for the next implementation PR)
1. Confirm canonical schema decision in docs (`auth.users -> profiles/transactions/categories/receipts`).
2. Add migration notes that formally mark legacy branch artifacts as deprecated/non-runtime.
3. Regenerate and verify `src/types/database.ts` against canonical schema.
4. Refactor `/api/transactions` POST to validate and map only supported fields.
5. Add focused verification notes for auth/RLS and decimal-handling behavior.

### Affected files (expected next PR)
- `supabase/migrations/*` (schema convergence/deprecation notes)
- `src/types/database.ts`
- `src/app/api/transactions/route.ts`
- `docs/architecture/DATA_MODEL.md`
- `docs/architecture/API_CONTRACTS.md`
- `README.md` (if API/runtime behavior wording changes)

### Risks
- Legacy schema drift may break assumptions during migration ordering.
- API behavior tightening may surface client payload mismatches.
- Decimal precision risk remains until numeric handling is explicit in app-domain logic.
- RLS/security regressions are possible if schema alignment touches table ownership semantics.
- Mock-vs-persisted confusion can increase if docs are not updated in lockstep.

### Verification steps
Baseline:
- `npm run lint`
- `npm run typecheck`

When route/schema/type changes are included:
- `npm run build`
- Manual auth/API smoke checks for `/api/transactions`, `/api/categories`, `/api/receipts`
- Security review notes for ownership enforcement and receipt path isolation

### Assumptions / open questions
- **Assumption:** runtime path should remain auth-user keyed (`auth.users` + `public.profiles`, `transactions`, `categories`, `receipts`).
- **Open question:** should legacy migration artifacts be removed, superseded, or retained only for historical context?
- **Open question:** what minimum persisted reporting outputs are required before replacing current mock dashboard cards/charts?

### Goal
Stabilize the MVP backend on a single canonical schema and hardened API boundaries so persisted finance flows can replace mock-heavy dashboard behavior safely.

### Current behavior
- Runtime backend uses Next.js route handlers in `src/app/api/*` with Supabase server client and owner-scoped queries against `public.transactions`, `public.categories`, and `public.receipts`.
- Auth uses Supabase Auth with middleware/session refresh and `requireUser()` server guard.
- DB has a canonical auth-user keyed path (`auth.users -> public.profiles` + finance tables) **and** a divergent legacy migration branch (`public.users`, `public.accounts`, alternate transactions/receipts columns).
- Dashboard/reports/transactions UI remain mostly mock-data backed despite existing API routes.
- Money is stored as `numeric(12,2)` in SQL, but TypeScript uses `number` and summary math currently uses JS number reductions.

### Top 5 backend priorities
1. **Schema convergence and drift removal (highest risk reducer).**
   - Define canonical migration path and deprecate or isolate legacy `public.users/accounts` branch.
   - Add explicit migration/recovery notes and confirm generated DB types align.
2. **Harden API input contracts for finance endpoints.**
   - Replace raw body spreading in transaction insert path with explicit field validation + allowlist.
   - Enforce server-derived ownership fields and safe defaults at route boundaries.
3. **Wire dashboard/reports to persisted data path.**
   - Replace mock-data finance widgets with server-fetched summaries/transaction data from canonical tables.
   - Keep placeholder features clearly labeled where parity is incomplete.
4. **Introduce decimal-safe domain computation layer.**
   - Prevent float-based accounting aggregates in app logic (report totals, summaries, future VAT/tax rules).
   - Add deterministic fixtures for revenue/expense calculations.
5. **Security and auditability hardening for compliance-sensitive flows.**
   - Add explicit tests/checks for auth isolation, RLS assumptions, and receipt access boundaries.
   - Define append-only correction model (reversal/adjustment) before adding edit-heavy finance features.

### Single highest leverage next implementation slice
**Slice:** Canonical schema alignment pass + API contract hardening for `/api/transactions` (boundary validation + explicit insert payload) with docs/type synchronization.

**Why this slice:**
- It reduces immediate security/data-integrity risk from accepting unchecked request payloads.
- It creates a safer foundation for replacing mock UI with persisted flows.
- It forces resolution of schema/documentation drift that currently risks building against the wrong model.

**Implementation decision for this task:**
- **Not implemented in this pass.**
- Reason: this slice spans migrations/types/API/docs and is not low-risk “small and bounded” until schema branch decisions are finalized.

## Schema convergence pass (docs and plan only, March 23, 2026)

### Canonical schema decision
Keep the auth-user keyed runtime path as the only canonical backend model:
- identity: `auth.users` -> `public.profiles`
- finance tables: `public.transactions`, `public.categories`, `public.receipts`
- storage path convention: private `receipts` bucket with per-user folder prefix

### Legacy or divergent artifacts to deprecate (do not extend)
From `supabase/migrations/202603200004_finance_assistant_mvp.sql`:
- `public.users`
- `public.accounts`
- alternate `public.transactions` shape (`merchant`, `account_id`, `category` text)
- alternate `public.receipts` shape (`file_url`, `merchant`, `amount`, `vat`)
- receipt policy coupling ownership through `receipts.transaction_id` instead of `receipts.user_id`

### Proposed migration sequence (safe path)
1. **Decision lock + docs alignment**
   - record canonical model in architecture docs and PLANS.
   - mark divergent migration artifacts as legacy/non-runtime.
2. **Preflight inventory migration**
   - add a non-destructive migration that reports/flags existence of legacy tables/columns/policies in target environments.
   - no table drops in this step.
3. **Compatibility guard migration**
   - add comments and defensive checks that prevent re-creating legacy ownership paths in future migrations.
   - keep runtime path untouched.
4. **Type regeneration and contract sync**
   - regenerate `src/types/database.ts` from canonical schema.
   - ensure docs and API contracts reference only canonical table shapes.
5. **Controlled cleanup migration (after verification window)**
   - remove or archive legacy tables/policies only after confirming no runtime dependencies and taking backups.

### Rollback / recovery notes
- For steps 1-4 (docs/guardrails/type sync), rollback is a standard git revert.
- For step 5 (cleanup), require:
  - pre-drop snapshot/backup,
  - scripted recreation SQL for removed legacy artifacts,
  - post-restore RLS/policy verification checklist.
- If cleanup causes regressions, restore from snapshot and re-apply only canonical-path migrations.

### Type regeneration requirements
- After schema-affecting convergence migrations, regenerate `src/types/database.ts` from Supabase schema.
- Block merge if generated types still include deprecated legacy runtime entities.
- Verify profile fields and finance table columns in types match canonical migration state.

### Risks
- Hidden environment drift where legacy tables exist with production data.
- Breaking historical scripts or ad-hoc queries that still point to legacy tables.
- Incomplete policy restoration if rollback is attempted without scripted recovery.

### Assumptions
- Runtime code and active APIs continue to use canonical auth-user keyed tables only.
- Legacy artifacts are either unused or can be archived before hard deletion.


## Non-destructive schema convergence prep (implementation slice)

### Goal
Reduce schema drift risk without altering runtime behavior or dropping legacy artifacts.

### Low-risk guardrails to add now
1. Explicitly label canonical runtime schema path in architecture docs and planning docs.
2. Add migration-adjacent guidance that legacy branch tables are deprecated for new work.
3. Define generated type regeneration workflow and required drift checks.
4. Audit and document code references that still imply legacy schema usage (if any).

### Out of scope for this slice
- dropping/renaming any table
- destructive cleanup of legacy artifacts
- broad runtime data-access rewrites
- business-logic changes

### Verification for this slice
- `npm run typecheck`
- `npm run build`
- `npm run lint` only if non-interactive in current environment

### Expected outputs
- docs and plan updates only
- migration-adjacent guardrail notes (non-executable)
- drift list and next implementation slice recommendation

### Execution status in this environment
- Inventory mechanism implemented as migration view: `public.legacy_schema_inventory`.
- Supabase CLI is not available in this container (`supabase: command not found`), so full generated-type regeneration was blocked.
- Required command when CLI is available:
  - Local linked DB: `supabase gen types typescript --local > src/types/database.ts`
  - Remote project: `supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts`
- Manual low-risk reconciliation applied for clear canonical drift (`profiles.username` in `src/types/database.ts`).


## Charting library migration (March 24, 2026)

### Goal
Replace Recharts with a modern, maintainable charting approach across dashboard chart surfaces while preserving current data behavior and visual consistency.

### Current behavior
- Chart components in `src/components/finance/*`, `src/components/dashboard/*`, and `src/components/dashboard-ui/*` use Recharts primitives directly.
- Current chart types are line charts and donut/pie charts.
- Data is passed as typed arrays for reusable chart components or imported from `src/lib/mock-data` for scaffolded views.
- Styling is handled through Tailwind classes plus inline chart color/theme props.
- Docs currently reference Recharts in `README.md` and `docs/architecture/ENGINEER_ONBOARDING_GUIDE.md`.

## Dashboard currency formatting refactor (March 27, 2026)

### Goal
Use each company's configured base currency when formatting dashboard and reports monetary values instead of hardcoded USD.

### Current behavior
- `formatCurrencyFromCents` always formats as USD.
- `getDashboardFinanceData` does not load currency metadata from `company_settings`.
- KPI cards, reports KPI cards, and recent transaction displays all rely on the USD formatter.

### Proposed approach
1. Extend dashboard loader to fetch `company_settings.base_currency` for the active `company_id`.
2. Add `currencyCode` to the dashboard data contract, with `DKK` fallback if missing.
3. Update `formatCurrencyFromCents` to accept an optional currency code argument and default to `DKK`.
4. Pass `currencyCode` through dashboard and reports UI consumers (KPI cards and transaction amount displays).

### Affected files
- `src/lib/dashboard-data.ts`
- `src/components/finance/kpi-cards.tsx`
- `src/components/finance/recent-transactions.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/reports/page.tsx`

### Risks
- Invalid or unexpected currency codes from data can cause formatter runtime errors.
- Missing wiring in one consumer could leave mixed currency displays.

### Verification steps
- `npm run lint`
- `npm run typecheck`

### Proposed approach
1. Remove `recharts` and implement reusable internal SVG chart primitives for React 19/Next.js compatibility and long-term maintainability.
2. Add shared chart components under `src/components/charts/`.
3. Migrate all line and donut chart components to the shared primitives with responsive containers and hover tooltips.
4. Preserve existing labels/colors/data-shape behavior and keep visual style aligned with existing cards/sections.
5. Update docs and dependency references to remove Recharts and document the internal chart primitives.

### Affected files
- `package.json`
- `src/components/finance/overview-chart.tsx`
- `src/components/finance/expense-breakdown.tsx`
- `src/components/dashboard/revenue-expense-chart.tsx`
- `src/components/dashboard-ui/line-chart-section.tsx`
- `src/components/dashboard-ui/donut-chart-section.tsx`
- `src/components/charts/*` (new shared utilities)
- `README.md`
- `docs/architecture/ENGINEER_ONBOARDING_GUIDE.md`

### Risks
- Tooltip behavior and axis formatting may differ from Recharts defaults.
- Donut hover/label behavior in the custom SVG implementation can need tuning for very small slices.
- Unused legacy chart component groups may still add maintenance surface unless consolidated later.

### Verification steps
- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions
- Existing chart surfaces are presentation-focused and may continue using mock data where already used.
- No new chart types are required beyond existing line and donut/pie charts in this migration.

## Auth password reset vertical slice (March 25, 2026)

### Goal
Add a complete Supabase-auth-based password recovery flow (request + reset confirmation + optional verification resend) across API routes and auth UI while keeping responses minimal and non-sensitive.

### Current behavior
- API currently supports signup/login/logout only under `src/app/api/auth/*`.
- Auth UI currently includes login/signup pages and shared `AuthForm` component, without reset-password UX.
- Security rules require minimal error messaging and no token/secrets logging.

### Proposed approach
1. Add API endpoints under `src/app/api/auth/*` for:
   - forgot-password email request
   - password update/reset confirmation for recovery sessions
   - resend verification email (optional endpoint)
2. Add auth pages/components for `/forgot-password` and `/reset-password` in `src/app/(auth)`.
3. Update login/signup/auth navigation links to include reset + verification message paths.
4. Keep boundary input validation strict and return generic/non-sensitive errors per security rules.
5. Keep identity source in Supabase Auth only (no local password storage/tables).

### Affected files
- `src/app/api/auth/*` (new route handlers + minor login/signup response hardening)
- `src/app/(auth)/*` (new reset pages/components and login message handling)
- `src/components/ui/auth-form.tsx`
- `docs/architecture/API_CONTRACTS.md`
- `README.md`

### Risks
- Supabase reset flow depends on correctly configured redirect URLs.
- Overly generic API errors can reduce UX clarity if client messaging is not explicit.
- Verification resend behavior may vary if user is already confirmed.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- **Assumption:** reset links will target app route `/reset-password` via `emailRedirectTo`.
- **Assumption:** optional staged rollout can use a simple env flag with default enabled behavior.

## Session management vertical slice (March 25, 2026)

### Goal
Implement authenticated self-session APIs and a Settings session-management panel aligned to the API contract target (`GET /me/sessions`, `DELETE /me/sessions/{session_id}`) via Next.js `/api/me/sessions/*` handlers.

### Current behavior
- No `/api/me/sessions` routes exist.
- Settings page is static placeholder content and does not surface active auth sessions.
- No session-specific audit hook interface exists for revocation actions.

### Proposed approach
1. Add server route handlers:
   - `GET /api/me/sessions`: authenticate via `supabase.auth.getUser()` and return only sessions from authenticated context.
   - `DELETE /api/me/sessions/{session_id}`: validate UUID, verify ownership from authenticated context, block revoking current session, then revoke target session.
2. Implement ownership-safe Supabase Auth REST calls with bearer token from current authenticated session (never trust client user IDs).
3. Add an audit-ready hook interface for session revoke events (non-persistent placeholder, no sensitive logging).
4. Add a settings subpanel UI for listing/revoking sessions behind a feature flag so backend can ship first.
5. Update API contracts and security docs to reflect current runtime support and authz expectations.

### Affected files
- `src/app/api/me/sessions/route.ts`
- `src/app/api/me/sessions/[session_id]/route.ts`
- `src/lib/auth.ts`
- `src/lib/auth-flags.ts`
- `src/lib/session-events.ts` (new)
- `src/components/settings/sessions-panel.tsx` (new)
- `src/app/(dashboard)/settings/page.tsx`
- `docs/architecture/API_CONTRACTS.md`
- `docs/security/SECURITY_RULES.md`

### Risks
- Supabase project/API version differences may affect session-management endpoint availability.
- Session metadata availability may vary by auth provider/client context.
- Must avoid accidental current-session revocation and sensitive error leakage.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- **Assumption:** Supabase Auth session-management endpoints are available through project auth REST base URL with authenticated bearer token.
- **TODO:** replace placeholder audit hook implementation with immutable persistent audit events once audit subsystem exists.

## Company bootstrap + company profile persistence slice (March 25, 2026)

### Goal
Add canonical, additive company tenancy primitives and persisted company profile editing via onboarding/settings without extending the legacy `public.users/accounts` branch.

### Current behavior
- No canonical `companies` or `company_memberships` tables exist in runtime schema.
- Onboarding and settings business fields are placeholder-only and not persisted.
- No `/api/companies` route group exists.

### Proposed approach
1. Add a new additive Supabase migration for `companies`, `company_memberships`, and `company_settings` with RLS policies bound to authenticated membership checks.
2. Include migration rollback/recovery notes and keep changes scoped to canonical `auth.users` identity.
3. Add `/api/companies` route handler supporting:
   - `GET` current user company profile/settings via membership.
   - `POST` bootstrap create for users without an existing membership (single-company bootstrap).
   - `PATCH` update allowed fields with strict auth + owner membership check.
4. Wire onboarding/settings forms to persisted API behavior (create first, then update) with no placeholder-only path.
5. Update docs (`DATA_MODEL`, `API_CONTRACTS`, `README`) and regenerate `src/types/database.ts` contract to include new tables.

### Affected files
- `supabase/migrations/*` (new additive migration)
- `src/types/database.ts`
- `src/app/api/companies/route.ts`
- `src/app/(dashboard)/onboarding/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `docs/architecture/DATA_MODEL.md`
- `docs/architecture/API_CONTRACTS.md`
- `README.md`

### Risks
- Incorrect RLS policy composition could allow unintended cross-tenant access.
- Bootstrap logic might allow duplicate company creation if membership uniqueness is not enforced.
- UI route flow may diverge if onboarding/settings do not share the same persisted contract.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Manual smoke: create company in onboarding, reload/settings edit and confirm values persist.

### Assumptions / open questions
- Assumption: each user bootstraps exactly one initial company in this MVP slice; multi-company UX remains future work.
- Assumption: base currency and fiscal year start are stored in `company_settings` to keep profile and operational settings separated.

## Baseline company RBAC slice (March 25, 2026)

### Goal
Ship a small, testable server-enforced RBAC baseline for company settings/member management using canonical `auth.users` + `companies/company_memberships`.

### Current behavior
- `company_memberships.role` supports only `owner|member`.
- `/api/companies` owner check is hardcoded (`role === "owner"`) without reusable permission helpers.
- No explicit `roles/permissions/role_permissions` schema or invitation endpoint exists.

### Proposed approach
1. Add additive migration for `roles`, `permissions`, `role_permissions`, and `company_invitations`.
2. Tie `company_memberships.role` to canonical `roles.key` and backfill `member -> staff`.
3. Seed baseline roles (`owner`, `staff`, `read_only`) and permission matrix; seed advanced roles as disabled-by-flag placeholders.
4. Add reusable permission helper module in `src/lib` for company-scoped server checks.
5. Enforce permissions in `/api/companies` and new member/invitation endpoints.
6. Update API/security/readme docs for current runtime behavior.

### Affected files
- `supabase/migrations/*`
- `src/types/database.ts`
- `src/lib/auth-flags.ts`
- `src/lib/company-permissions.ts` (new)
- `src/app/api/companies/*`
- `docs/architecture/API_CONTRACTS.md`
- `docs/security/SECURITY_RULES.md`
- `README.md`

### Risks
- Existing `member` rows must be safely remapped to `staff` before FK enforcement.
- RLS and API checks can diverge if permission keys are changed without helper updates.
- Invitation flow remains skeleton-only (no accept flow yet).

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- **Assumption:** this MVP slice allows owner role reassignment only when at least one owner remains.
- **TODO:** finalize advanced-role permission matrix before enabling advanced role assignment.

## Active company context + switcher + settings expansion slice (March 25, 2026)

### Goal
Implement explicit multi-company context switching with persisted active-company selection, company-scoped API resolution, expanded persisted company settings fields, and a safe CVR lookup adapter interface with manual fallback.

### Current behavior
- Company context resolution defaults to first membership and is not persisted as user preference.
- No `/api/companies/switch` endpoint exists.
- Dashboard nav has no company switch control.
- Company settings persist only profile basics plus base currency/fiscal month.
- No CVR lookup route/adapter exists.
- Finance endpoints (`/api/transactions`, `/api/categories`, `/api/receipts`) are user-scoped, not active-company scoped.

### Proposed approach
1. Add additive migration for:
   - `profiles.active_company_id` (persisted active context)
   - `company_settings` expansion fields for invoice settings, branding/logo metadata, and branch/department placeholders
   - `company_id` columns + constraints/policies for finance tables (`transactions`, `categories`, `receipts`)
2. Update company context helper to resolve active company via `profiles.active_company_id` with safe fallback to first valid membership.
3. Add `POST /api/companies/switch` endpoint to validate membership and persist `active_company_id`.
4. Add top-nav company switch UI wired to switch endpoint and refresh.
5. Expand settings UI payload/fields and add a CVR lookup panel calling new CVR endpoint.
6. Add CVR adapter interface with default `not_configured` provider state and explicit manual-entry fallback path.
7. Enforce active-company membership + company_id filters on company-scoped endpoints (`companies`, `members`, `invitations`, `transactions`, `categories`, `receipts`).
8. Update docs (`API_CONTRACTS`, `DATA_MODEL`, `SECURITY_RULES`, `README`) to reflect runtime behavior and fallback semantics.

### Affected files
- `supabase/migrations/*` (new additive migration)
- `src/types/database.ts`
- `src/lib/company-permissions.ts`
- `src/lib/cvr/*` (new)
- `src/app/api/companies/switch/*`
- `src/app/api/companies/cvr/*`
- `src/app/api/transactions/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/receipts/route.ts`
- `src/components/shell/*`
- `src/components/settings/company-profile-form.tsx`
- `docs/architecture/API_CONTRACTS.md`
- `docs/architecture/DATA_MODEL.md`
- `docs/security/SECURITY_RULES.md`
- `README.md`

### Risks
- Incorrect policy updates could lock legitimate access or permit cross-company reads.
- Backfilling `company_id` on existing finance rows may be incomplete where users lack memberships.
- Active-company fallback behavior may surprise users with multiple memberships until they explicitly switch.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Manual smoke: switch company in dashboard, verify settings and finance APIs isolate by active company.

### Assumptions / open questions
- **Assumption:** CVR provider credentials/integration are not yet configured in this environment, so adapter returns explicit unavailable state.
- **Assumption:** Existing finance rows without `company_id` can remain hidden from active-company scoped APIs until remediated.

## Billing entitlements + soft-limit enforcement slice (March 25, 2026)

### Goal
Add an internal (non-provider-coupled) plans/subscriptions/entitlements data model with server-side limit enforcement for the first two limits: monthly voucher counter and rolling turnover cap.

### Current behavior
- No runtime tables/API currently expose company plan state, entitlements, or usage counters.
- Finance write path (`POST /api/transactions`) validates ownership and shape, but does not enforce plan limits.
- Settings UI has no billing/entitlement visibility or upgrade prompts.

### Proposed approach
1. Add additive migration for `plans`, `plan_entitlements`, `company_subscriptions`, and `usage_counters` with RLS and baseline seeded plan config.
2. Add shared entitlement service in `src/lib` for:
   - active plan + entitlement read
   - usage snapshot calculation (monthly voucher count and rolling turnover)
   - enforcement decisioning with warning + soft lock outcomes
3. Add `/api/entitlements` read endpoint and admin seed endpoint (`/api/entitlements/admin/seed`) for internal config refresh.
4. Enforce limits server-side in `POST /api/transactions`; return explicit soft-lock payload when blocked.
5. Add settings UI surface for current plan, usage thresholds, warning/lock messaging, and upgrade prompt.
6. Add rollout feature-flag support so enforcement can be enabled by plan tier.
7. Update architecture/product/security docs and DB types to reflect the new runtime behavior.

### Affected files
- `supabase/migrations/*` (new additive migration)
- `src/types/database.ts`
- `src/lib/auth-flags.ts`
- `src/lib/entitlements.ts` (new)
- `src/app/api/entitlements/*` (new)
- `src/app/api/transactions/route.ts`
- `src/components/settings/entitlements-panel.tsx` (new)
- `src/app/(dashboard)/settings/page.tsx`
- `docs/architecture/API_CONTRACTS.md`
- `docs/architecture/DATA_MODEL.md`
- `docs/product/MVP_SCOPE.md`
- `docs/security/SECURITY_RULES.md`

### Risks
- Numeric precision drift if turnover checks are implemented with float math.
- Locking writes at API layer may impact existing UI flows unless response contract is handled gracefully.
- RLS/policy mismatches can leak plan configuration or cross-company usage data.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- **Assumption:** voucher counting maps to transaction creation volume in MVP until invoices/vouchers are split into dedicated ledgers.
- **Assumption:** rolling turnover cap uses 12-month revenue sum from `transactions` where `type = 'revenue'`.
- **TODO:** provider-coupled subscription sync remains a future milestone; subscription state remains internal source of truth in this slice.

## Remove temporary placeholder data slice (March 25, 2026)

### Goal
Remove temporary/mock placeholder finance data from dashboard and transactions surfaces so UI reflects persisted data or explicit empty states.

### Current behavior
- `src/lib/mock-data.ts` seeds KPI/chart/transaction values used by active dashboard and transactions pages.
- Reports summary cards also render fixed hardcoded amounts.
- Legacy `src/components/dashboard-ui/*` components include embedded dummy arrays and labels.

### Proposed approach
1. Add a shared dashboard data mapper that reads canonical `transactions` and `categories` in active company context.
2. Compute KPI cards, monthly trend points, expense breakdown, and recent transactions from persisted rows using decimal-safe cent parsing.
3. Update dashboard/reports/transactions pages and finance components to consume mapped persisted data and render empty states when no data exists.
4. Remove `src/lib/mock-data.ts` and replace legacy dashboard-ui embedded mock datasets with explicit empty-state rendering.

### Affected files
- `src/lib/dashboard-data.ts` (new)
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/reports/page.tsx`
- `src/app/(dashboard)/transactions/page.tsx`
- `src/components/finance/*`
- `src/components/dashboard-ui/*`
- `src/lib/mock-data.ts` (delete)

### Risks
- Numeric formatting drift if amount parsing is inconsistent across views.
- Empty-company onboarding experience must remain understandable when no transactions exist.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Account and authentication completion slice (March 25, 2026)

### Goal
Complete the MVP account-security flow using existing Supabase-auth architecture: signup/login/logout/reset/verification plus profile security surface for MFA status, sessions/devices, and login activity.

### Current behavior
- Signup/login/logout/forgot/reset/resend-verification routes exist.
- Session list/revoke API exists and settings page shows active sessions.
- No dedicated account profile page summarizes security status.
- No MFA management API/UI currently exists.
- Device history and login alerts are not exposed as first-class account features (session data exists but is only shown as a revoke list).

### Proposed approach
1. Add `/api/me/account` endpoint to return profile + security summary from authenticated context.
2. Add MFA API endpoints under `/api/me/mfa/*` using Supabase Auth MFA APIs (assumption: TOTP factors enabled in project settings).
3. Add `/api/me/devices` and `/api/me/login-alerts` endpoints derived from authenticated session records.
4. Add a dashboard account page (`/account`) to display name/email/security status/active sessions/last login/MFA status with device + alert history.
5. Keep signup/login/logout/reset/verification behavior in existing routes, and tighten login response payload for account summary use.
6. Add docs updates for newly implemented account endpoints and known MFA/login-alert assumptions.

### Affected files
- `src/app/api/me/account/route.ts` (new)
- `src/app/api/me/devices/route.ts` (new)
- `src/app/api/me/login-alerts/route.ts` (new)
- `src/app/api/me/mfa/*` (new)
- `src/lib/session-management.ts` (shared mapping helpers)
- `src/app/(dashboard)/account/page.tsx` (new)
- `src/components/shell/sidebar.tsx` (account nav entry)
- `docs/architecture/API_CONTRACTS.md`
- `README.md`

### Risks
- Supabase MFA endpoints may return project-config-dependent errors if MFA is disabled.
- Login alerts are derived from session activity; no outbound email sender exists in repo beyond Supabase-auth emails.
- Session API availability differs by Supabase plan/version; endpoint code must fail safely.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Manual smoke: signup/login, account page load, MFA enroll/challenge/verify path, session revoke path.

### Assumptions / open questions
- **Assumption:** Supabase project supports MFA TOTP endpoints from authenticated session context.
- **Assumption:** login alerts in this slice are in-app account alerts derived from new/unknown session activity; external alert channel wiring remains TODO.
- **TODO:** add persistent audit events/notification delivery once notification subsystem exists.

## Account/auth full-set completion follow-up (March 25, 2026)

### Goal
Close remaining quality and completeness gaps for the full account/auth feature set, including verification UX polish, MFA challenge UX for existing factors, non-interactive lint/test validation setup, and explicit notification-architecture constraints.

### Gap analysis snapshot
- Core signup/login/logout/reset/verification/session APIs already exist in runtime code.
- Account page exists, but verification resend and existing-factor MFA challenge/confirm UX are incomplete.
- Lint command is interactive due missing repo ESLint config.
- No test script/tooling exists, preventing required validation.

### Proposed approach
1. Add repo-consistent ESLint configuration so `npm run lint` runs non-interactively.
2. Add minimal TypeScript test runner setup (`node --import tsx --test`) and targeted tests for auth utility validation + account-security mappings.
3. Extend account security UI to support verification resend and explicit MFA challenge/confirm flow for already enrolled factors.
4. Document notification-system constraint and MVP-equivalent login-alert behavior in docs.

### Verification
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Signup failure investigation + fix slice (March 25, 2026)

### Goal
Restore reliable new-account signup by removing fragile redirect-url assumptions in auth routes and by exposing actionable signup error messages for faster diagnostics.

### Current behavior
- `POST /api/auth/signup` always sends `emailRedirectTo` computed from `NEXT_PUBLIC_SITE_URL` fallback to request origin.
- If the computed URL is missing, malformed, or not allow-listed in Supabase Auth redirect settings, Supabase can reject signup with a generic route response (`Unable to create account.`).
- Similar redirect-url assumptions exist in forgot-password and resend-verification endpoints.

### Proposed approach
1. Add safe redirect URL resolver that validates configured site URL and proxy-forwarded host/protocol fallback.
2. Only include redirect URLs in Supabase calls when the resolved URL is valid.
3. Add targeted signup error classification so redirect misconfiguration and duplicate-account cases return actionable API errors.
4. Add fallback retry in signup without `emailRedirectTo` when Supabase rejects redirect URL.
5. Update docs (`README` + architecture contracts) with explicit env/setup guidance and new error semantics.

### Affected files
- `src/app/api/auth/utils.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/resend-verification/route.ts`
- `README.md`
- `docs/architecture/API_CONTRACTS.md`

### Risks
- Overly detailed auth errors can increase account enumeration risk.
- Proxy header parsing must avoid constructing malformed URLs.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- **Assumption:** primary signup failures reported are caused by invalid redirect URL config, not database trigger regressions.
- **TODO:** add route-level automated tests once test harness supports TS route modules directly.

## Forgot-password route access fix (March 25, 2026)

### Goal
Allow unauthenticated users to access password recovery pages (`/forgot-password`, `/reset-password`) without middleware redirect loops.

### Current behavior
- Middleware treats only `/login` and `/signup` as auth-public routes.
- Unauthenticated requests to `/forgot-password` and `/reset-password` are redirected to `/login`.
- This makes the “Forgot password?” link appear broken and blocks direct recovery-link navigation.

### Proposed approach
1. Extend middleware auth-public route matcher to include `/forgot-password` and `/reset-password`.
2. Preserve existing behavior where authenticated users are redirected away from auth pages to `/dashboard`.
3. Keep route logic isolated to middleware (no API/auth contract changes).

### Affected files
- `src/lib/supabase/middleware.ts`
- `PLANS.md`

### Verification steps
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Assumptions
- Password-reset flow remains feature-flagged in UI, but routes should stay publicly reachable for valid reset links.

## Reset-link session bootstrap fix (March 25, 2026)

### Goal
Ensure password reset links establish a valid recovery session before submitting a new password.

### Current behavior
- `/api/auth/reset-password` correctly requires an authenticated recovery session.
- Reset page submits directly to API without exchanging reset link params (`code` or `token_hash`) for a session.
- Users can see `Reset session is invalid or expired.` even with a fresh reset link.

### Proposed approach
1. In reset-password client form, bootstrap session from URL params:
   - `code` -> `exchangeCodeForSession`
   - `token_hash` + `type=recovery` -> `verifyOtp`
2. Fall back to existing session check when params are absent.
3. Gate submit until recovery session bootstrap completes and show actionable error for invalid/expired links.

### Affected files
- `src/app/(auth)/_components/reset-password-form.tsx`
- `PLANS.md`

### Verification steps
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Assumptions
- Supabase reset emails may use either `code` (PKCE) or `token_hash` recovery link formats depending project settings.

## Signup error classification hardening (March 25, 2026)

### Goal
Reduce opaque signup failures by mapping additional Supabase signup errors to actionable responses while preserving non-sensitive messaging.

### Current behavior
- Unknown Supabase signup errors return `Unable to create account. Please try again.`
- This can hide common operational misconfigurations like disabled signups and DB-trigger failures.

### Proposed approach
1. Extend signup error classifier to include:
   - signups disabled
   - password-policy failures
   - profile-trigger/database-save failures
2. Include a short support reference code in fallback responses to improve operator diagnostics.
3. Keep account-enumeration-safe behavior for duplicate-email handling.

### Affected files
- `src/app/api/auth/signup/route.ts`
- `PLANS.md`

### Verification steps
- `npm run typecheck`
- `npm test`
- `npm run build`

## Settings information architecture refactor (March 27, 2026)

### Goal
Refactor the Settings area into clear top-level tabs (Personal, Company, Team & Access, Sales & Documents, Accounting & Tax, Banking & Payments, Integrations) while preserving existing forms, permissions, and save behavior.

### Current behavior
- `/settings` renders a mixed page that combines `CompanyProfileForm`, a tax placeholder, entitlements, and sessions.
- `/account` separately renders `AccountSecurityPanel`, splitting user security workflows away from settings.
- Sidebar contains both `Account` and `Settings`, creating overlapping navigation for account/security configuration.
- There is no nested settings navigation or tab-specific routing.

### Proposed approach
1. Add a shared settings IA config that defines top-level tabs, descriptions, and visibility gates.
2. Add a nested settings layout/navigation (`/settings` landing + `/settings/[tab]`) with stable links.
3. Rehome existing settings UI:
   - Account security and sessions into Personal.
   - Company profile and entitlements into Company.
   - Tax placeholder into Accounting & Tax.
4. Add placeholder index content for Team & Access, Sales & Documents, Banking & Payments, and Integrations.
5. Preserve old deep links by redirecting `/account` to `/settings/personal`.
6. Update global nav labels and docs note describing the new settings IA.

### Affected files
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/[tab]/page.tsx` (new)
- `src/app/(dashboard)/settings/layout.tsx` (new)
- `src/app/(dashboard)/account/page.tsx`
- `src/components/shell/sidebar.tsx`
- `src/components/shell/top-nav.tsx`
- `src/lib/settings/navigation.ts` (new)
- `docs/architecture/SETTINGS_INFORMATION_ARCHITECTURE.md` (new)
- `README.md`

### Risks
- Tab visibility could drift from permission model if not tied to membership permissions/feature flags.
- Redirecting `/account` may affect users with saved bookmarks if not handled server-side.
- Existing mixed `CompanyProfileForm` still contains cross-domain defaults; placeholders need to clearly mark future split without implying completed behavior.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- Assumption: showing structural placeholder pages for required top-level tabs satisfies “hide empty sections,” because tabs have explicit scope and implementation status text.
- Assumption: current codebase does not yet include dedicated workspace-level Security & Audit, Payroll, Automation, or Developer settings pages, so optional tabs remain hidden.

## Settings IA optional-tab expansion (March 27, 2026)

### Goal
Add the remaining optional Settings tabs (Automation, Payroll, Developer, Security & Audit) to the settings information architecture in a safe, feature-gated way.

### Current behavior
- Settings currently includes only the seven core tabs.
- Optional tabs from the IA spec are not represented in routing or navigation.

### Proposed approach
1. Extend settings tab definitions with optional tabs and concise descriptions.
2. Keep optional tabs hidden by default and expose them only via explicit feature flags and existing role/permission checks.
3. Add placeholder index content for each optional tab to preserve IA structure without implying full implementation.
4. Update docs note with optional tab gating behavior.

### Affected files
- `src/lib/settings/navigation.ts`
- `src/app/(dashboard)/settings/[tab]/page.tsx`
- `docs/architecture/SETTINGS_INFORMATION_ARCHITECTURE.md`
- `PLANS.md`

### Risks
- Optional tabs could be accidentally visible by default if feature-flag defaults are not defensive.
- Role checks for payroll/developer surfaces can drift unless tied to existing advanced-role toggles.

### Verification steps
- `npm run typecheck`
- `npm run build`

### Assumptions
- New feature flags can be introduced with safe defaults (off) without changing runtime behavior for existing environments.

## Settings default visibility adjustment (March 27, 2026)

### Goal
Make all Settings tabs visible by default, including optional tabs, unless explicitly disabled.

### Current behavior
- Optional tabs are hidden unless explicit `NEXT_PUBLIC_ENABLE_SETTINGS_*` flags are set to `true`.
- Additional advanced-role checks can hide payroll/developer tabs even when users expect to see full IA.

### Proposed approach
1. Change optional tab flag logic to default-on (only hide when a flag is explicitly `false`).
2. Remove unnecessary advanced-role gate from optional tab visibility so full tab IA is visible by default for eligible company users.
3. Keep baseline membership/permission checks already used for company settings visibility.

### Affected files
- `src/lib/settings/navigation.ts`
- `PLANS.md`

### Verification steps
- `npm run typecheck`
- `npm run build`

## Transactions workspace create+list slice (March 27, 2026)

### Goal
Expand the dashboard transactions page into a persisted-data workspace that can create transactions through `/api/transactions` and render the persisted list with resilient UI states.

### Current behavior
- `src/app/(dashboard)/transactions/page.tsx` renders dashboard-derived transaction rows from `getDashboardFinanceData` and includes non-functional search/filter controls.
- No in-page transaction create form is wired to `/api/transactions`.
- Entitlement warning and soft-lock payloads from `/api/transactions` are not surfaced in this page workflow.

### Proposed approach
1. Replace the page body with a dedicated client workspace component for transactions.
2. Add `transaction-form.tsx` with API-contract fields: `description`, `amount`, `type`, `date`, optional `category_id`, optional `receipt_id`.
3. Fetch persisted transactions from `GET /api/transactions` with loading, empty, and error states.
4. Submit form to `POST /api/transactions`; on success prepend created row and reset form.
5. Surface user-visible entitlement states for:
   - `429` soft lock responses (`upgrade_prompt` + lock message)
   - successful write warnings (`entitlement_warning` + optional `upgrade_prompt`)

### Affected files
- `src/app/(dashboard)/transactions/page.tsx`
- `src/components/transactions/transaction-form.tsx` (new)
- `src/components/transactions/transactions-workspace.tsx` (new)

### Risks
- API may return numeric `amount` as string/number depending Supabase serialization; UI formatting must handle both safely.
- Existing page-level mock/search controls are removed in favor of persisted-only behavior, which may change perceived UX.
## No-company onboarding gate for dashboard pages (March 27, 2026)

### Goal
Introduce a reusable empty/onboarding state across dashboard surfaces when a user has no active company membership context.

### Current behavior
- `dashboard`, `transactions`, and `reports` pages fall back to empty datasets when `getCompanyMembershipContext(...)` returns `null`.
- `receipts` page currently renders scaffold/mock receipt UI without checking membership context.
- Top navigation already hides the company switcher when no companies are available.

### Proposed approach
1. Add a reusable `NoCompanyState` shell component with explanation text and CTAs to `/onboarding` and `/settings/company`.
2. Gate dashboard widgets/tables/receipt scaffolding in each target page by checking membership and rendering `NoCompanyState` early when membership is `null`.
3. Keep existing `DashboardShell` + `TopNav` membership sourcing unchanged so company switch behavior remains stable in no-membership sessions.

### Affected files
- `src/components/shell/no-company-state.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/transactions/page.tsx`
- `src/app/(dashboard)/reports/page.tsx`
- `src/app/(dashboard)/receipts/page.tsx`

### Risks
- Slight UX/content mismatch if onboarding/settings routes evolve independently.
- Additional membership checks in pages duplicate shell-level checks (acceptable for explicit page gating).
## Receipts inbox persisted-data slice (March 27, 2026)

### Goal
Replace the mock-backed receipts dashboard page with a real persisted receipt inbox UI using company-scoped API data and uploads.

### Current behavior
- `src/app/(dashboard)/receipts/page.tsx` renders a hardcoded in-memory receipts array.
- `src/app/api/receipts/route.ts` supports `POST` upload/insert only.
- No `GET /api/receipts` metadata listing endpoint exists for persisted receipts.

### Proposed approach
1. Add `GET /api/receipts` route handler in `src/app/api/receipts/route.ts` with auth + active-company membership enforcement.
2. Return only persisted receipt metadata rows required by the UI: `id`, `path`, `created_at`, `transaction_id`.
3. Rebuild `src/app/(dashboard)/receipts/page.tsx` as a persisted-data inbox with:
   - upload form posting to `/api/receipts`
   - loading/error states
   - empty state
   - list/grid of persisted receipts
4. Avoid raw private storage-path exposure as clickable preview links; show metadata only until a controlled signed-URL flow is introduced.
5. Update API/runtime docs for the new `GET /api/receipts` contract.

### Affected files
- `src/app/api/receipts/route.ts`
- `src/app/(dashboard)/receipts/page.tsx`
- `docs/architecture/API_CONTRACTS.md`
- `README.md`
- `PLANS.md`

### Risks
- Leaking private receipt storage paths via direct links if UI adds naive preview behavior.
- Missing membership checks could permit cross-company reads.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- **Assumption:** Optional `category_id` / `receipt_id` are entered manually as UUIDs because no receipt-list endpoint exists and category list endpoint currently supports create/delete only.
- **Assumption:** `null` from `getCompanyMembershipContext(...)` should consistently mean "show onboarding gate" for these four pages.
### Assumptions
- Current inbox requirement is metadata listing + upload; receipt preview/download will use a future controlled signed URL endpoint.

## Category browsing + selection in transactions (March 27, 2026)

### Goal
Enable transaction workflows to browse persisted categories, select them from picker controls, and manage category create/delete directly in the active dashboard flow.

### Current behavior
- `/api/categories` supports `POST` and `DELETE` only.
- Transactions form accepts raw `category_id` text input instead of persisted category selection.
- Transactions page has no category-based filter control and no integrated category-management CTA when none exist.

### Proposed approach
1. Add `GET /api/categories` with authenticated active-company membership checks and user/company scoping.
2. Introduce a reusable category picker component and wire it into transaction create form and transactions list filtering controls.
3. Integrate category create/delete UI controls into transactions workspace using existing `CategoryManager` API patterns.
4. Add an explicit empty-category state with CTA to create the first category from the transactions workflow.

### Affected files
- `src/app/api/categories/route.ts`
- `src/components/transactions/category-picker.tsx` (new)
- `src/components/transactions/category-manager.tsx`
- `src/components/transactions/transaction-form.tsx`
- `src/components/transactions/transactions-workspace.tsx`
- `README.md`
- `docs/architecture/API_CONTRACTS.md`
- `PLANS.md`

### Risks
- Category list and transaction list can drift in UI if create/delete state is not synchronized.
- Empty-state CTA can be confusing if category manager is not visibly available in same workflow.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions
- Category selection follows company-shared ownership within active company context in this MVP (`user_id` retained for traceability metadata only).

## Company-shared finance ownership policy alignment (March 27, 2026)

### Goal
Define and enforce a canonical ownership policy for `transactions`, `categories`, and `receipts` as company-shared resources (membership + `company_id`), then align API filters, RLS, docs, and regression coverage.

### Current behavior
- Runtime API requires active-company membership but still narrows several reads and deletes by `user_id = auth.uid()`.
- Existing finance RLS policies combine membership checks with `user_id = auth.uid()`, which blocks same-company cross-user visibility.
- Architecture/product/security docs describe company scoping but do not explicitly lock a canonical company-shared ownership policy for these tables.

### Proposed approach
1. Document canonical ownership in architecture docs (`DATA_MODEL`, `API_CONTRACTS`).
2. Update finance API and dashboard data queries to scope by `company_id` (plus membership gate) instead of per-user narrowing for shared entities.
3. Add a migration to replace finance RLS policies with membership-based company access and remove `user_id = auth.uid()` authorization gating.
4. Add regression tests for expected shared visibility and cross-company denial constraints.
5. Update `README`, security rules, and MVP scope docs to match implemented behavior.

### Affected files
- `docs/architecture/DATA_MODEL.md`
- `docs/architecture/API_CONTRACTS.md`
- `src/app/api/transactions/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/receipts/route.ts`
- `src/lib/dashboard-data.ts`
- `supabase/migrations/*` (new migration)
- `tests/*` (new regression tests)
- `README.md`
- `docs/security/SECURITY_RULES.md`
- `docs/product/MVP_SCOPE.md`

### Risks
- Broadening company-level visibility can surface data users did not previously see within shared companies.
- RLS policy mistakes could create cross-tenant leakage if membership predicates are incomplete.
- Receipt metadata sharing must not be misrepresented as public object-path access; storage remains private and path-isolated.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Assumptions / open questions
- **Assumption:** canonical policy for MVP is company-shared ownership for `transactions`, `categories`, and `receipts` rows, while preserving `user_id` as creator metadata.
- **TODO:** add end-to-end DB policy tests against a live Supabase test database in a follow-up if CI gains DB test infra.

## Posting immutability + reversal infrastructure slice (March 27, 2026)

### Goal
Introduce an append-only posting workflow foundation with immutable audit events, period locking semantics, and reversal-first correction APIs.

### Current behavior
- Transactions are persisted and company-scoped, but there is no posting state model or journal entity separation.
- No reversal endpoint exists for correcting posted accounting records.
- No period lock table/semantics exist for preventing late posting into closed periods.
- No immutable audit-event table exists for posting lifecycle traceability.

### Proposed approach
1. Add architecture spec documenting posting states, reversal/adjustment rules, period lock semantics, and audit-event schema.
2. Add additive migrations for posting/journal entities, period locks, audit events, and non-destructive immutability triggers.
3. Add `src/lib/postings/service.ts` as the posting domain boundary for validation, posting, reversal, lock checks, and audit writes.
4. Add API routes under `src/app/api/postings/*` for list/create posting, period lock list/create, and reversal actions.
5. Add tests that verify immutability guardrails and reversal traceability contracts.
6. Update generated DB types and API docs/README for new runtime contracts.

### Affected files
- `docs/architecture/POSTING_IMMUTABILITY_SPEC.md` (new)
- `supabase/migrations/202603270002_posting_and_audit_immutability.sql` (new)
- `src/lib/postings/service.ts` (new)
- `src/app/api/postings/route.ts` (new)
- `src/app/api/postings/[posting_id]/reverse/route.ts` (new)
- `src/app/api/postings/period-locks/route.ts` (new)
- `src/types/database.ts`
- `docs/architecture/API_CONTRACTS.md`
- `docs/architecture/DATA_MODEL.md`
- `README.md`
- `tests/posting-immutability-and-reversal.test.js` (new)

### Risks
- Immutability trigger scope could block expected draft edits if state transitions are not explicit.
- Reversal logic can create duplicate reversals without strict source-entry checks.
- Period lock checks are date-based and could be bypassed if posting date semantics drift.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Assumptions / TODO
- **Assumption:** account-side double-entry detail remains MVP-level and does not yet encode full Danish chart-of-accounts rules.
- **TODO:** add integration tests against a live Supabase test DB for trigger and RLS behavior when CI DB infra is available.


## Receipt upload validation hardening (March 27, 2026)

### Goal
Harden `/api/receipts` upload boundary validation for file type, size, and filename safety; normalize object-key generation; and document/test enforced controls.

### Current behavior
- Receipts upload accepted any browser-provided MIME type and size.
- Storage key used `Date.now()` + raw `file.name`.
- Validation responses were limited to missing file checks and non-deterministic storage/database error text.

### Proposed approach
1. Add explicit MIME allowlist and max-size checks before upload.
2. Reject unsafe filenames (path traversal/control characters/unsafe patterns).
3. Normalize storage key generation to `user_id/company_id/<uuid>.<ext>` with server-side extension extraction only.
4. Return deterministic `400` responses with stable validation codes.
5. Add tests covering allowlist/blocked-type and oversize branches, plus filename/key normalization invariants.
6. Update README + security rules with enforced limits.

### Affected files
- `src/app/api/receipts/route.ts`
- `tests/receipts-upload-validation.test.js`
- `README.md`
- `docs/security/SECURITY_RULES.md`
- `PLANS.md`

### Risks
- Existing clients uploading non-allowlisted formats will now receive explicit `400` validation errors.
- Any consumer depending on storage key inclusion of original filename will break (not expected in canonical runtime).

### Verification steps
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions
- A 10 MB max upload size is acceptable for MVP receipt capture until product defines legal archival constraints.

## API security + fixture-backed regression test expansion (March 27, 2026)

### Goal
Add an executable test plan and initial contract suites for API auth enforcement, company/role isolation, transaction entitlement boundaries, receipt upload boundaries, and deterministic golden-dataset-aligned fixtures.

### Current behavior
- Tests currently focus on a few contract checks (ownership, posting immutability, receipt validation).
- There is no dedicated suite asserting auth guards across key API route handlers.
- There is no deterministic fixture module encoding the golden dataset scenarios from docs.

### Proposed approach
1. Add a dedicated test plan doc for this expansion under `docs/testing/`.
2. Add deterministic fixture definitions in `tests/fixtures/` aligned to `docs/testing/GOLDEN_DATASETS.md` naming and scenarios.
3. Add initial Node test suites that verify:
   - auth and membership gating on key API routes,
   - company isolation and permission checks on `/api/companies/*` and finance endpoints,
   - transaction validation and entitlement enforcement branches in `/api/transactions` and `src/lib/entitlements.ts`,
   - receipt upload boundary controls in `/api/receipts`.
4. Add fixture-structure tests to ensure stable IDs, decimal-safe amounts, and deterministic timestamps.

### Affected files
- `docs/testing/API_SECURITY_AND_BOUNDARY_TEST_PLAN.md` (new)
- `docs/testing/TEST_STRATEGY.md`
- `docs/testing/GOLDEN_DATASETS.md`
- `tests/fixtures/golden-datasets.js` (new)
- `tests/api-auth-and-permissions.test.js` (new)
- `tests/transactions-entitlements-boundary.test.js` (new)
- `tests/receipts-upload-boundary-contract.test.js` (new)
- `tests/golden-dataset-fixtures.test.js` (new)
- `PLANS.md`

### Risks
- Contract-style tests validate implementation markers, not runtime Supabase behavior.
- Fixture scenarios can drift from future product changes unless docs and fixtures are maintained together.

### Verification steps
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / TODO
- **Assumption:** initial suites in this pass remain source-contract tests due current test harness.
- **TODO:** add API integration tests against seeded Supabase test data when DB test infra is available.

## Database types regeneration + schema-contract verification (March 27, 2026)

### Goal
Regenerate `src/types/database.ts` from the current canonical schema and verify the generated contract is structurally valid, canonically complete, and free of legacy runtime entities.

### Current behavior
- `src/types/database.ts` exists and currently includes canonical finance, company, RBAC, entitlement, and posting/audit tables.
- Supabase CLI may be unavailable in constrained environments, which can block direct regeneration.
- Guardrail docs mention generation commands but do not yet require a checksum verification step.

### Proposed approach
1. Attempt canonical regeneration command for `src/types/database.ts`.
2. Validate generated file structure (single `Database` type, no malformed duplicate interface sections).
3. Verify canonical table coverage (`profiles`, `transactions`, `categories`, `receipts`, company/RBAC/entitlements).
4. Verify legacy runtime entities (`public.users`, `public.accounts`) are not reintroduced in active contract.
5. Document regeneration + checksum/verification workflow in `supabase/migrations/README_SCHEMA_GUARDRAILS.md`.

### Affected files
- `src/types/database.ts`
- `supabase/migrations/README_SCHEMA_GUARDRAILS.md`
- `PLANS.md`

### Risks
- Supabase CLI unavailability can prevent true regeneration in this environment.
- Manual reconciliation risks drift if migrations change without regeneration.

### Verification steps
- `npm run typecheck`
- `npm run lint`
- Structural grep checks for duplicate/malformed type sections and legacy entities.
- Checksum command for regenerated types.

### Assumptions / open questions
- **Assumption:** canonical active contract intentionally excludes legacy `public.users`/`public.accounts` entities.
- **Open question:** should CI enforce checksum drift detection for `src/types/database.ts` in future.

## Documentation status alignment pass (March 27, 2026)

### Goal
Align module-status documentation with runtime evidence from `src/app/api/*`, `src/lib/*`, and `supabase/migrations/*`.

### Current behavior
- Status claims across `tasks/EPICS.md`, `docs/product/PRODUCT_MODULE_MAP.md`, and `AGENTS.md` were partially inconsistent with new posting/audit/RBAC runtime evidence.

### Proposed approach
1. Build one module-status table from runtime evidence.
2. Update conflicting statements in the three status docs.
3. Add explicit **As of** dates and evidence links in updated sections.
4. Add a lightweight doc-consistency checklist to `README.md`.

### Affected files
- `tasks/EPICS.md`
- `docs/product/PRODUCT_MODULE_MAP.md`
- `AGENTS.md`
- `README.md`

### Risks
- Overstating implementation depth (especially VAT/tax and advanced role workflows).
- Linking evidence outside requested scope.

### Verification steps
- `npm run lint`
- `npm run typecheck`

### Assumptions / open questions
- Assumption: status evidence should prioritize canonical runtime path over legacy migration artifacts.
- Assumption: onboarding/support UX remains outside this specific runtime evidence table when not represented in `src/app/api/*`.

## Fine-grained finance write permissions + RLS alignment (March 27, 2026)

### Goal
Add explicit finance write/manage permission keys and enforce them consistently at API and database policy layers for same-company members.

### Current behavior
- Baseline RBAC seeds company/invitation permissions only.
- Finance mutation APIs currently allow any active company member (`owner`, `staff`, `read_only`) to write if authenticated and in-company.
- RLS for transactions/receipts/posting tables is membership-based (`for all`) without role-permission gating.

### Proposed approach
1. Add additive migration to seed new `public.permissions` keys and `public.role_permissions` mappings.
2. Add helper permission constants/check wrappers in `src/lib/company-permissions.ts`.
3. Enforce explicit permission checks in finance POST handlers (transactions, receipts, postings, reversals, period locks).
4. Replace broad membership `for all` RLS with split read vs mutation policies that check role-permission membership.
5. Extend regression tests to cover owner/staff allowed and read_only denied behavior for same-company write attempts.

### Affected files
- `supabase/migrations/*` (new additive migration for seeds + RLS policy alignment)
- `src/lib/company-permissions.ts`
- `src/app/api/transactions/route.ts`
- `src/app/api/receipts/route.ts`
- `src/app/api/postings/route.ts`
- `src/app/api/postings/[posting_id]/reverse/route.ts`
- `src/app/api/postings/period-locks/route.ts`
- `tests/*` (permission regression coverage)
- `README.md` and relevant docs for API/security behavior

### Risks
- Over-restrictive RLS may block expected internal writes if permission joins are incorrect.
- Permission-key drift between migration seeds and TS constants can create false denials.
- Existing data access flows may assume read_only can mutate.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `node --test tests/api-auth-and-permissions.test.js tests/posting-immutability-and-reversal.test.js tests/transactions-entitlements-boundary.test.js`

### Assumptions / open questions
- Assumption: `owner` and `staff` should keep finance write permissions; `read_only` should not.
- TODO: advanced-role permission matrix remains partial and may need future explicit assignments.

## Dashboard dead-code retirement (March 27, 2026)

### Goal
Confirm whether `src/components/dashboard-ui/*` and `src/components/dashboard/*` are reachable from `src/app/**`, retire unreachable files, and add a repeatable import-graph audit process.

### Current behavior
- `src/app/**` imports active dashboard views from `src/components/finance/*`.
- `src/components/dashboard-ui/*` and `src/components/dashboard/*` appear to be a legacy UI set and may no longer be wired into route entrypoints.
- No lightweight, repo-native periodic import-graph check exists for this legacy component scope.

### Proposed approach
1. Trace imports starting at `src/app/**` and follow transitive `@/` or relative imports to confirm reachability into the two target component folders.
2. Archive unreachable files to a clearly labeled non-runtime directory for reference.
3. Update docs to reflect retired paths and add a periodic dead-code audit command.
4. Run lint/typecheck/build to verify no runtime regressions.

### Affected files
- `src/components/dashboard-ui/*` (moved to archive if unreachable)
- `src/components/dashboard/*` (moved to archive if unreachable)
- `archive/components/*` (new archived location and readme)
- `scripts/*` (new import-graph audit script)
- `package.json` (new npm script)
- `README.md` and/or `docs/testing/*` (audit process docs)

### Risks
- False negatives in import tracing if resolver aliases are not handled correctly.
- Accidental removal of files that are only loaded dynamically by string paths.
- Drift between docs and actual script behavior.

### Verification steps
- `npm run deadcode:audit-dashboard-components`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions or open questions
- Assumption: dashboard component files with no path from any `src/app/**` module are safe to retire from runtime.
- Open question: whether additional legacy component folders should be folded into the same audit later.

## Migration audit + sequencing documentation (March 27, 2026)

### Goal
Audit existing SQL migrations for reliability issues and document explicit execution order/dependencies for environments where sequence matters.

### Current behavior
- Migrations are timestamp-named and generally intended to run in lexical order.
- Dependency edges (for example, function/table prerequisites across migration files) are implicit rather than documented in one canonical runbook.
- Some policy-creation statements in `202603270003_finance_write_permissions_and_rls_alignment.sql` are not safely repeatable if the migration is replayed in drifted/staging environments.

### Proposed approach
1. Patch SQL policy creation blocks that can fail on replay by adding missing `drop policy if exists` guards before recreate.
2. Add a migration-order runbook under `supabase/migrations/` with:
   - canonical full run order,
   - dependency checkpoints,
   - explicit sequence-sensitive notes,
   - rollback/recovery operational guidance references.
3. Link this runbook from README so contributors apply the same sequence.

### Affected files
- `supabase/migrations/202603270003_finance_write_permissions_and_rls_alignment.sql`
- `supabase/migrations/MIGRATION_ORDER.md` (new)
- `README.md`

### Risks
- Editing existing migrations can diverge from already-applied production histories; this pass assumes repository migrations are still the canonical source for new environment setup.
- Sequence docs may become stale unless updated with future migration additions.

### Verification steps
- `npm run lint`
- `npm run typecheck`
- manual SQL diff review for policy idempotency guards and migration-order documentation accuracy.

### Assumptions / open questions
- **Assumption:** Environments consuming this repository may need replay-safe behavior during drift reconciliation.
- **Open question:** whether future work should freeze historical migrations and move all fixes into forward-only corrective migrations.

## Decimal parsing + bigint cent utility hardening (March 29, 2026)

### Goal
Eliminate float-based amount parsing/aggregation paths by moving to regex-validated decimal strings and bigint minor-unit arithmetic.

### Current behavior
- `parseAmount` in `src/app/api/transactions/route.ts` uses `Number(...)` after regex checks.
- `src/lib/data.ts` summary aggregation uses JS number reductions on amount values.
- No shared finance decimal utility module exists for canonical string<->minor-unit conversions.

### Proposed approach
1. Add a shared utility module in `src/lib` for decimal-string-to-cents (`bigint`) and cents-to-decimal-string conversions.
2. Refactor `parseAmount` to accept validated decimal strings and normalize via bigint cent conversion only (no `Number(...)`).
3. Remove `src/lib/data.ts` if unreachable dead code (or migrate to bigint-safe cent aggregation if still active).
4. Add regression tests to assert no float parsing patterns and verify deterministic conversions for edge decimals and large values.

### Affected files
- `src/lib/finance-decimals.ts` (new)
- `src/app/api/transactions/route.ts`
- `src/lib/data.ts` (delete if dead)
- `tests/transactions-decimal-regression.test.js` (new)
- `PLANS.md`

### Risks
- Validation strictness change could reject non-string payloads that were previously tolerated.
- Conversion helper misuse could alter normalization for edge decimal inputs.

### Verification steps
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Assumptions / open questions
- Assumption: transaction API should enforce string amount input for deterministic decimal parsing.
