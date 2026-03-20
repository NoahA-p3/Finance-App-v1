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
