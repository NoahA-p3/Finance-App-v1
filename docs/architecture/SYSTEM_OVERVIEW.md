# System Overview

Related docs: [Technical Module Boundaries](./TECHNICAL_MODULES.md), [Data Model](./DATA_MODEL.md), [API Contracts](./API_CONTRACTS.md), [Security Rules](../security/SECURITY_RULES.md).

**Last verified:** 2026-03-27.

## Last-verified policy
- Keep this date as the evidence timestamp for architecture claims in this file.
- Update the date when claims are re-checked against current repository evidence (code, migrations, and scripts).
- If a section is partially inferred, label it explicitly as **Assumption**.

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
  - `finance` for KPI and chart cards,
  - `settings` for account/company/team access surfaces,
  - `transactions` and `receipts` for operations.

## Backend/API structure
- Route handlers include:
  - auth (`/api/auth/*`),
  - account (`/api/me/*`),
  - companies/member access (`/api/companies*`),
  - finance endpoints (`/api/transactions`, `/api/categories`, `/api/receipts`),
  - posting endpoints (`/api/postings*`).
- Auth gating in middleware:
  - `src/middleware.ts`
  - `src/lib/supabase/middleware.ts`

## Database and auth setup
- Supabase Auth as identity provider.
- Canonical runtime identity/data path:
  - `auth.users` -> `public.profiles`
  - company-scoped records in `public.transactions`, `public.categories`, `public.receipts`
- RLS and company-membership checks enforce workspace isolation.
- Auth trigger `handle_new_user()` syncs `auth.users` to `public.profiles`.

## Dashboard and reports data source (current)
- Dashboard and Reports pages call `getDashboardFinanceData(...)` in `src/lib/dashboard-data.ts`.
- Data is loaded from persisted tables, not static mock fixtures:
  - `transactions` filtered by `company_id`,
  - `categories` filtered by `company_id`,
  - `company_settings.base_currency` for display currency.
- KPI totals, trend series, expense mix, and recent transaction rows are computed server-side from these persisted rows.

## Supabase usage
- Server client: `src/lib/supabase/server.ts`
- Browser client: `src/lib/supabase/client.ts`
- Middleware client/session refresh: `src/lib/supabase/middleware.ts`
- Storage bucket: `receipts` (private) with company/user-scoped path policy pattern.

## Data flow (simplified)
1. User authenticates via `/api/auth/*` route handlers.
2. Middleware verifies session and redirects auth/non-auth routes.
3. Protected pages use `requireUser()` for server-side auth checks.
4. UI calls company-scoped APIs (`/api/transactions`, `/api/categories`, `/api/receipts`, `/api/postings*`).
5. Route handlers use Supabase server client; RLS + membership enforcement protect tenancy boundaries.
6. Receipt files are stored in Supabase Storage; DB stores receipt metadata/path references.

## Key modules and responsibilities
- `src/lib/auth.ts`: protected-route helper.
- `src/lib/dashboard-data.ts`: dashboard/report aggregation from persisted company data.
- `src/types/database.ts`: generated TypeScript schema contract.
- `supabase/migrations/*`: source of truth for schema/policies.

## Module-aligned technical documentation
- Product modules and status: `docs/product/PRODUCT_MODULE_MAP.md`
- Technical module boundaries (schema + API ownership): `docs/architecture/TECHNICAL_MODULES.md`
- Target relational domains: `docs/architecture/DATA_MODEL.md`
- Target resource/endpoints map: `docs/architecture/API_CONTRACTS.md`

## Explicit placeholders and planned gaps
- **Settings placeholder tabs:** several settings tabs intentionally render placeholder content until backed by persisted feature models (`banking-payments`, `integrations`, `automation`, `payroll`, `developer`, `security-audit`, plus partially placeholder guidance in `sales-documents` and `accounting-tax`).
- **Invitation acceptance:** invitation creation/listing is implemented, but invite acceptance flow is explicitly not implemented yet in current UI/runtime.
- **VAT engine:** VAT/tax rule automation is still planned; current settings copy explicitly marks this as TODO.

## Schema convergence notes
- Treat auth-user and company-scoped tables as the canonical runtime model for API and feature work.
- Legacy/divergent artifacts remain in migrations and should not be extended for new work unless explicitly scoped.
- After schema-affecting migrations, regenerate `src/types/database.ts` and resolve drift in the same PR.
