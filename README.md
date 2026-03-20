# Finance Assistant SaaS MVP

A deploy-ready Next.js + Supabase MVP with auth, dashboard, transactions, categories, receipt uploads, and a tax widget.

## Quick start

1. Copy `.env.example` to `.env.local` and fill in Supabase keys.
2. Run `npm install`.
3. Run `npm run dev`.
4. Apply SQL migration in `supabase/migrations/202603200001_init.sql`.
5. Create a Supabase Storage bucket named `receipts` (private recommended).

## Deploy

- Push to GitHub.
- Import project into Vercel.
- Add the environment variables from `.env.example`.

## Vercel build troubleshooting

If your Vercel log stops shortly after `next build` starts, double-check that all three environment variables below are set in **Project → Settings → Environment Variables** for the target environment (Production/Preview/Development):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Missing Supabase values can cause build/runtime failures that look unrelated at first glance.

