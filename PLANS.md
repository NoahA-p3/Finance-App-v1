# PLANS.md

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
