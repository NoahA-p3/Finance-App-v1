# Finance Assistant MVP

Finance Assistant is a Next.js + Supabase accounting web app aimed at freelancers and small businesses in Denmark.

> Current product state: early MVP foundation. Auth, profile, transaction/category/receipt data paths, and dashboard scaffolding exist. Danish accounting and VAT domain depth is mostly planned.

## What the app does (current)
- User signup/login/logout with Supabase Auth.
- Protected dashboard routes via Next.js middleware.
- Basic profile record sync in `public.profiles`.
- Transaction CRUD surface (currently list + create via `/api/transactions`).
- Category create/delete via `/api/categories`.
- Receipt file upload to private Supabase Storage bucket (`receipts`) via `/api/receipts`.
- Dashboard/reporting UI is mostly placeholder/mock-data driven.

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
4. Start dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Scripts
- `npm run dev` — start local dev server
- `npm run lint` — Next.js lint
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — production build
- `npm run start` — run built app

## Supabase and database
- SQL migrations: `supabase/migrations/`
- Generated DB type file: `src/types/database.ts`
- Apply migrations (Supabase CLI):
  ```bash
  supabase db push
  ```

## Repository structure
- `src/app/(auth)` — login/signup routes
- `src/app/(dashboard)` — protected app sections (dashboard, transactions, receipts, reports, settings, onboarding)
- `src/app/api` — route handlers for auth, transactions, categories, receipts
- `src/components` — UI and feature components
- `src/lib` — auth helper, Supabase clients, data-fetch helpers
- `supabase/migrations` — schema, triggers, RLS/storage policy definitions
- `docs/` — product, domain, architecture, testing, security, UX docs
- `tasks/EPICS.md` — prioritized implementation roadmap

## Documentation map
- Product index: `docs/product/README.md`
- Product core docs: `docs/product/PRD.md`, `docs/product/PRODUCT_MODULE_MAP.md`, `docs/product/DELIVERY_PHASES.md`, `docs/product/MVP_SCOPE.md`
- Domain: `docs/domain/DK_ACCOUNTING_RULES.md`, `docs/domain/DK_VAT_RULES.md`, `docs/domain/LEGAL_FORM_RULES.md`
- Architecture: `docs/architecture/SYSTEM_OVERVIEW.md`, `docs/architecture/DATA_MODEL.md`, `docs/architecture/API_CONTRACTS.md`, `docs/architecture/ENGINEER_ONBOARDING_GUIDE.md`
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
- Ensure Supabase Auth URL settings include the deployed app domain and redirect URLs.
