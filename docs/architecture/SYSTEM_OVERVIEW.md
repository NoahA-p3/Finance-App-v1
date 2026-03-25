# System Overview

Related docs: [Technical Module Boundaries](./TECHNICAL_MODULES.md), [Data Model](./DATA_MODEL.md), [API Contracts](./API_CONTRACTS.md), [Security Rules](../security/SECURITY_RULES.md).

## Architecture summary (current)
- Single Next.js App Router application.
- Supabase provides Auth, Postgres, and Storage.
- API layer is Next.js route handlers under `src/app/api/*`.
- Deployment target is Vercel (no custom `vercel.json` currently).

## Frontend structure
- `src/app/(auth)` — login/signup pages.
- `src/app/(dashboard)` — protected routes:
  - `dashboard`, `transactions`, `receipts`, `reports`, `settings`, `onboarding`.
- `src/components/*`:
  - `shell` for app layout/navigation/account menu,
  - `finance`/`dashboard` for KPI and charts,
  - `transactions` for transaction/receipt/category components.

## Backend/API structure
- Route handlers:
  - `src/app/api/auth/signup/route.ts`
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/logout/route.ts`
  - `src/app/api/transactions/route.ts`
  - `src/app/api/categories/route.ts`
  - `src/app/api/receipts/route.ts`
- Auth gating in middleware:
  - `src/middleware.ts`
  - `src/lib/supabase/middleware.ts`

## Database and auth setup
- Supabase Auth as identity provider.
- Canonical runtime identity/data path:
  - `auth.users` -> `public.profiles`
  - `public.transactions`, `public.categories`, `public.receipts`
- Legacy/divergent artifacts exist in one migration branch (`public.users`, `public.accounts`, alternate transaction/receipt columns) and are documented as deprecated for new work.
- Do not extend legacy branch tables for new features unless task scope explicitly targets legacy support.
- RLS policies enforce per-user ownership on major tables.
- Auth trigger `handle_new_user()` syncs `auth.users` to `public.profiles`.

## Supabase usage
- Server client: `src/lib/supabase/server.ts`
- Browser client: `src/lib/supabase/client.ts`
- Middleware client/session refresh: `src/lib/supabase/middleware.ts`
- Storage bucket: `receipts` (private) with folder-per-user policy pattern.

## Vercel deployment shape
- Standard Next.js deployment (assumption based on repo).
- Required public env vars for runtime client/server operations.
- No repo-level deployment automation docs beyond README currently.

## Data flow (simplified)
1. User authenticates via `/api/auth/*` route handlers.
2. Middleware verifies session and redirects auth/non-auth routes.
3. Protected pages use `requireUser()` for server-side auth checks.
4. UI calls `/api/transactions`, `/api/categories`, `/api/receipts`.
5. Route handlers use Supabase server client; RLS enforces tenant boundaries.
6. Receipt files stored in Supabase Storage; DB stores `path` references.

## Key modules and responsibilities
- `src/lib/auth.ts`: protected-route helper.
- `src/lib/data.ts`: transaction summary query helpers.
- `src/types/database.ts`: generated-ish TypeScript schema contract.
- `supabase/migrations/*`: source of truth for schema/policies.


## Module-aligned technical documentation
- Product modules and status: `docs/product/PRODUCT_MODULE_MAP.md`
- Technical module boundaries (schema + API ownership): `docs/architecture/TECHNICAL_MODULES.md`
- Target relational domains: `docs/architecture/DATA_MODEL.md`
- Target resource/endpoints map: `docs/architecture/API_CONTRACTS.md`

## Major gaps / TODOs
- Canonical schema direction needs consolidation (active vs legacy migration branch).
- No formal service layer between route handlers and data store.
- No background jobs or webhook consumers.
- No explicit ledger posting/period-close subsystem.
- No automated test suite in repo.


## Schema convergence notes
- Treat auth-user keyed tables as the only canonical runtime model for API and feature work.
- Plan schema cleanup in phased migrations: inventory -> guardrails -> type regeneration -> controlled legacy cleanup.
- Inventory helper view for convergence checks: `public.legacy_schema_inventory` (added via non-destructive migration).
- Require backup/recovery procedures before any destructive legacy-table removal.


## Generated type workflow guardrail
- After schema-affecting migrations, regenerate `src/types/database.ts` before merge.
- Confirm canonical runtime entities (`profiles`, `transactions`, `categories`, `receipts`) are represented correctly and legacy runtime entities are not reintroduced in app contracts.
- If migrations and generated types disagree, treat migrations as source of truth and resolve drift in the same PR.
