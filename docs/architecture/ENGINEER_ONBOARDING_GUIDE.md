# Engineer Onboarding Guide (Repository Deep Review)

This guide is written for an engineer seeing this repository for the first time. It focuses on **what is actually implemented now**, not just planned architecture.

---

## 1) What this repository does (plain English)

This is a single Next.js app (`App Router`) that provides the skeleton of a finance assistant product for freelancers/small businesses. Right now, it has:

- working email/password auth with Supabase,
- protected dashboard routes,
- profile synchronization into `public.profiles`,
- basic backend APIs for transactions/categories/receipt upload,
- mostly mock-data-driven dashboard UI surfaces.

The repo mixes two states:
1. **Active MVP runtime path** using `auth.users` + `profiles/transactions/categories/receipts` (what route handlers and dashboard shell use now), and
2. **Legacy/divergent schema artifacts** (e.g., `users/accounts` model and unused UI component groups) that look like earlier iterations.

---

## 2) Repo structure map + tech stack

## Tech stack (evidence-backed)

- **Framework/runtime:** Next.js 15 + React 19 + TypeScript (`package.json`).
- **Styling/UI:** Tailwind CSS (`tailwind.config.ts`, `src/app/globals.css`).
- **Backend services:** Supabase Auth/Postgres/Storage (`src/lib/supabase/*`, SQL migrations).
- **Charts:** Internal reusable SVG chart components (`src/components/charts/*`) used by finance/dashboard chart sections.
- **Validation lib present:** Zod in dependencies, but little/no current usage in route handlers.

## Directory-by-directory breakdown (important parts)

### `/src/app`

- `layout.tsx`: global HTML shell + theme init script.
- `page.tsx`: marketing/landing page.
- `(auth)/...`: login/signup pages + auth-specific layout.
- `(dashboard)/...`: authenticated pages (`dashboard`, `transactions`, `receipts`, `reports`, `settings`, `onboarding`) with shared layout requiring auth.
- `api/...`: server route handlers for auth and basic finance operations.

### `/src/lib`

- `supabase/server.ts`, `supabase/client.ts`, `supabase/middleware.ts`: Supabase client wiring for server, browser, and middleware cookie/session refresh.
- `auth.ts`: `requireUser()` guard used by server components/layouts.
- `data.ts`: DB query helpers + summary aggregation (currently unused by pages).
- `mock-data.ts`: seeded mock data used by current dashboard UI components.

### `/src/components`

- `shell/*`: active dashboard navigation/chrome and account menu.
- `finance/*`: active KPI/chart/transaction UI components used on dashboard pages.
- `ui/*`: reusable primitives + auth form.
- `dashboard-ui/*`, `dashboard/*`, `transactions/*`, `layout/*`: appear to be alternate or legacy component sets with little/no active runtime usage.

### `/supabase/migrations`

SQL source of truth for schema + RLS + storage policies. There are conflicting migration branches:

- Auth-keyed `profiles/categories/transactions/receipts` model,
- another migration introducing `users/accounts` and an alternate transaction/receipt shape.

### `/docs`

Contains architecture, security, domain, testing, and product docs. Much of this is roadmap-oriented and should be read as **intent + current-state notes**.

### `/tasks`

Roadmap/epics (`tasks/EPICS.md`), useful for planned sequence but not runtime truth.

---

## 3) Main entry points + primary runtime flows

## Runtime entry points

1. **App entry shell:** `src/app/layout.tsx`
2. **Unauthenticated landing:** `src/app/page.tsx`
3. **Auth pages:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
4. **Authenticated app pages:** all routes under `src/app/(dashboard)/*`
5. **Server API entry points:** `src/app/api/**/route.ts`
6. **Cross-cutting auth guard:** `src/middleware.ts` + `src/lib/supabase/middleware.ts`

## Important execution paths (walkthrough)

### A. Signup + first login flow

1. User submits `AuthForm` in signup mode (`src/components/ui/auth-form.tsx`).
2. Client POSTs to `/api/auth/signup` with email/password/first+last name.
3. `src/app/api/auth/signup/route.ts` calls `supabase.auth.signUp(...)` and sets `emailRedirectTo` using `NEXT_PUBLIC_SITE_URL` fallback logic.
4. Supabase auth trigger `public.handle_new_user()` populates/updates `public.profiles` (`supabase/migrations/202603200002_auth_profiles.sql`, overridden in later migrations).
5. User then signs in through `/api/auth/login`; on success, client router pushes `/dashboard`.

### B. Auth protection + session refresh flow

1. Next middleware runs on most non-static/non-API routes (`src/middleware.ts`).
2. `updateSession()` constructs Supabase server client, refreshes cookies, then checks `supabase.auth.getUser()`.
3. Unauthenticated users hitting protected paths are redirected to `/login`.
4. Authenticated users visiting `/login` or `/signup` are redirected to `/dashboard`.
5. Dashboard route group layout also calls `requireUser()` as a server-side second gate.

### C. Dashboard shell + profile display flow

1. Dashboard page components wrap content in `DashboardShell`.
2. `DashboardShell` calls `requireUser()`, then selects profile row from `public.profiles`.
3. Display name is resolved by precedence: profile name → auth metadata name → email prefix.
4. Shell renders `Sidebar`, `TopNav`, and page content.

### D. Transaction/category/receipt API flow

- **Transactions** (`/api/transactions`):
  - `GET`: fetch current user rows sorted by date desc.
  - `POST`: inserts body + forced `user_id`.
- **Categories** (`/api/categories`):
  - `POST`: insert category for current user.
  - `DELETE`: hard-delete by `id` + `user_id`.
- **Receipts** (`/api/receipts`):
  - accepts multipart file,
  - uploads to `receipts` bucket at `${user.id}/${timestamp}-${filename}`,
  - inserts path metadata in `public.receipts`.

All rely on Supabase auth user context and database/storage policies for tenant isolation.

---

## 4) Major systems and responsibilities

## System A: Web app routing and rendering

- App Router groups split unauthenticated (`(auth)`) and authenticated (`(dashboard)`) experiences.
- Pages are mostly server components, with selective client components for interaction.
- Current dashboard/reporting experience is mostly presentation/mocked metrics, not full data-bound accounting workflows.

## System B: Authentication + identity projection

- Supabase Auth is the identity source.
- Middleware and `requireUser()` enforce route-level access.
- `profiles` table acts as app-side identity/profile mirror via trigger and client-side edits in account menu.

## System C: Finance data APIs (thin CRUD)

- Route handlers call Supabase directly; there is no service/repository abstraction layer.
- Validation is minimal in finance APIs (`POST /api/transactions` merges arbitrary request body into insert).
- Data integrity is expected to be enforced mostly via DB constraints + RLS.

## System D: Data persistence and policies (Supabase/Postgres/Storage)

- Core tables: `profiles`, `transactions`, `categories`, `receipts`.
- RLS uses owner checks on `auth.uid()`.
- Private storage bucket with folder-based object policy per user.

## System E: UI component ecosystems

There are effectively **multiple UI eras** in repo:

1. Active shell/finance/ui components used by current pages.
2. Additional component groups (`dashboard-ui`, etc.) that appear not wired into routes.

This likely reflects iterative design/prototyping and creates maintenance overhead unless consolidated.

---

## 5) How systems interact (integration view)

1. **Client UI** (`AuthForm`, dashboard pages, account menu) invokes either API routes or Supabase client SDK.
2. **Next.js API routes** use server Supabase client bound to request cookies.
3. **Supabase Auth** establishes identity and session cookies.
4. **Supabase Postgres + RLS** enforce per-user data access.
5. **Supabase Storage policies** enforce per-user receipt object access.
6. **Dashboard shell/pages** assemble profile identity and mostly mocked finance visuals.

Design intent appears to be a backend-light Next.js app delegating most auth/data security to Supabase policies.

---

## 6) Operational concerns

## Configuration + environment variables

Known variables (from `.env.example` and code usage):

- `NEXT_PUBLIC_SUPABASE_URL` (**required**, server + client + middleware usage)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (**required**, server + client + middleware usage)
- `SUPABASE_SERVICE_ROLE_KEY` (present in env example but not used in current code)
- `NEXT_PUBLIC_SITE_URL` (optional but used by signup route for email redirect URL construction)

## Build, run, and local dev

- Install: `npm install`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Start built app: `npm run start`

## Testing status

- No automated unit/integration/e2e tests configured in scripts.
- Current practical quality gate is lint/typecheck/build.
- Docs describe desired future test strategy, not an implemented test harness.

## Database operations

- Migrations live in `supabase/migrations/*`.
- Docs indicate `supabase db push` workflow.
- Risk: migration history contains divergent schema definitions requiring validation before production hardening.

## Deploy and runtime infra

- Intended target: Vercel with standard Next defaults.
- No repo-level deploy pipeline/IaC files observed.
- Supabase project config and environment wiring are external to repo.

## Observability/logging

- No structured logging framework or metrics/tracing integration found.
- Error handling mostly returns simple JSON messages.
- Security doc calls out observability/audit as TODO.

---

## Key classes/functions/services and responsibilities

### Auth/session/security
- `updateSession(request)` in `src/lib/supabase/middleware.ts`:
  middleware session refresh + auth redirect decisions.
- `requireUser()` in `src/lib/auth.ts`:
  server component/user guard.
- `createClient()` in `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`:
  Supabase client factories.

### API handlers
- `POST /api/auth/signup` (`src/app/api/auth/signup/route.ts`): create auth user + metadata.
- `POST /api/auth/login` (`src/app/api/auth/login/route.ts`): password auth.
- `POST /api/auth/logout` (`src/app/api/auth/logout/route.ts`): signout.
- `GET/POST /api/transactions` (`src/app/api/transactions/route.ts`): list + create transactions.
- `POST/DELETE /api/categories` (`src/app/api/categories/route.ts`): create/delete categories.
- `POST /api/receipts` (`src/app/api/receipts/route.ts`): file upload + receipt row insert.

### UI and interaction
- `AuthForm` (`src/components/ui/auth-form.tsx`): client validation + auth API calls.
- `DashboardShell` (`src/components/shell/dashboard-shell.tsx`): authenticated layout and profile hydration.
- `AccountMenu` (`src/components/shell/account-menu.tsx`): logout + profile update UX using Supabase client.

### Data logic
- `getTransactions`, `getSummary` (`src/lib/data.ts`): helper queries/aggregation; currently not integrated into active pages.

### Database-side functions/triggers
- `handle_new_user()` in migrations: sync from `auth.users` into `public.profiles`.
- `set_updated_at()` in hardening migration: auto-updates profile timestamp on write.

---

## Risks, confusing areas, likely maintenance problems

1. **Schema divergence risk (high):**
   migrations define conflicting table families (`auth.users`-keyed vs `public.users/accounts` model). New engineers can accidentally build against the wrong model.

2. **Mock-data vs real-data ambiguity (high):**
   major dashboard pages/components still use `src/lib/mock-data.ts`, while APIs and DB exist. Product behavior can look “implemented” but not be data-wired.

3. **Accounting integrity gap (high for domain):**
   transactions are mutable CRUD records; no append-only posting, reversal model, period locks, or audit log subsystem.

4. **Validation gap at API boundary (medium/high):**
   finance endpoints accept broad payloads with minimal request-level validation.

5. **Numeric precision handling in app logic (medium):**
   DB stores `numeric(12,2)` (good), but TypeScript uses `number` and `getSummary()` uses JS arithmetic; this conflicts with strict accounting precision expectations.

6. **Dead/parallel UI code paths (medium):**
   unused component ecosystems increase onboarding and refactor cost.

7. **Limited operational maturity (medium):**
   no in-repo CI policy, automated tests, or observability stack.

---

## Assumptions, unknowns, and places needing validation

### Assumptions
- Active production-intended schema is the auth-keyed `profiles/categories/transactions/receipts` path because route handlers and shell code use those tables.
- App is intended for Vercel + Supabase managed services.

### Unknowns
- Which migration set has actually been applied in the target Supabase environments.
- Whether `202603200004_finance_assistant_mvp.sql` is intentionally retained for historical reference or accidentally divergent.
- Whether account menu profile email update flow aligns with desired auth confirmation policy.
- Whether `src/lib/data.ts` is planned for immediate integration or stale.

### Validation checklist for first engineering week
1. Run DB introspection against target env and compare applied migrations to repo chronology.
2. Confirm canonical schema and archive/remove divergent migration path.
3. Trace every dashboard widget and mark mock vs real data source.
4. Decide and document transaction mutation model (append-only vs editable draft/posting states).
5. Add boundary validation (e.g., Zod) to write APIs.

---

## “Start here first” guide for a new engineer

1. **Read these three files first:**
   - `README.md`
   - `docs/architecture/SYSTEM_OVERVIEW.md`
   - `supabase/migrations/202603210001_profiles_schema_hardening.sql`

2. **Boot locally:**
   - copy env file, set Supabase values, run `npm install`, then `npm run dev`.

3. **Trace auth end-to-end:**
   - `AuthForm` → `/api/auth/*` routes → middleware redirect behavior.

4. **Trace one data flow end-to-end:**
   - `POST /api/receipts` route + storage policy in migrations.

5. **Map real vs mock screens:**
   - inspect dashboard pages and note where mock-data is still used.

6. **Before feature work:**
   - validate canonical schema branch and document it in architecture docs.

If you only have one day: prioritize understanding **middleware auth flow**, **Supabase schema/RLS**, and **which UI surfaces are actually connected to persisted data**.
