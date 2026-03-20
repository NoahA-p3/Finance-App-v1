# Finance Assistant SaaS MVP

A deploy-ready Next.js + Supabase MVP with auth, dashboard, transactions, categories, receipt uploads, and a tax widget.

## Quick start

1. Copy `.env.example` to `.env.local` and fill in Supabase keys.
2. Run `npm install`.
3. Run `npm run dev`.
4. In Supabase, open **SQL Editor** and run `supabase/migrations/202603200001_init.sql`.
5. In Supabase Auth, ensure **Email** provider is enabled (default for most projects).
6. Start using the app. The migration creates:
   - App tables (`categories`, `transactions`, `receipts`)
   - RLS policies for per-user access
   - A private `receipts` Storage bucket
   - Storage policies so each user can only manage files under `<user_id>/...`

## Supabase DB setup checklist

Use this once per new Supabase project:

1. Create project at [supabase.com](https://supabase.com), then copy:
   - Project URL
   - `anon` public API key
   - `service_role` key
2. Paste values into `.env.local` using `.env.example` as the template.
3. Execute `supabase/migrations/202603200001_init.sql` in SQL Editor.
4. Verify tables exist in **Table Editor**:
   - `public.categories`
   - `public.transactions`
   - `public.receipts`
5. Verify bucket exists in **Storage**:
   - `receipts` (private)
6. Create a test user in **Authentication** and sign in through `/signup`.
7. Create a category, add a transaction, and upload a receipt to confirm end-to-end DB access.

## Deploy

- Push to GitHub.
- Import project into Vercel.
- Add the environment variables from `.env.example`.
