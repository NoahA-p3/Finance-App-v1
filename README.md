# Finance Assistant (SaaS MVP)

Finance Assistant is a Next.js + Supabase SaaS dashboard for freelancers and small businesses.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS (shadcn-style component primitives)
- Recharts for KPI visualizations
- Supabase (Auth, Postgres, Storage)
- Vercel deployment target

## Architecture
- `src/app/(auth)` contains login/signup flows.
- `src/app/(dashboard)` contains protected product modules: dashboard, transactions, receipts, reports, settings, onboarding.
- `src/components/shell` defines the persistent app shell (sidebar + top nav).
- `src/components/finance` contains dashboard-specific widgets/charts.
- `src/lib/supabase` stores browser/server clients.
- `supabase/migrations` contains schema + RLS + storage bucket provisioning.

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and anon key.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Supabase schema
Run migrations in order with Supabase CLI:
```bash
supabase db push
```

Key tables used by the MVP schema:
- `users`
- `accounts`
- `transactions`
- `categories`
- `receipts`

Storage bucket:
- `receipts` (private, image/PDF uploads)

## Deploy to Vercel
1. Push this repository to GitHub.
2. Import the repo in Vercel.
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy and verify auth callback URLs in Supabase Auth settings.

