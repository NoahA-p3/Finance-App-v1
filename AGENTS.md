# AGENTS.md

## Repo purpose
Finance Assistant MVP for Danish freelancers and small businesses (enkeltmandsvirksomhed + ApS), built as a single Next.js app with Supabase.

## Stack and layout (current)
- Frontend + API: Next.js App Router in `src/app`
- Auth + DB + Storage: Supabase (`src/lib/supabase`, `supabase/migrations`)
- Generated DB types: `src/types/database.ts`
- This is **not** a monorepo; one app/package at repo root.

## Working rules for Codex sessions
1. **Money values must use exact decimal handling; never float math for accounting logic.**
2. **Posted accounting records are append-only.** Do not hard-delete/overwrite booked records; use reversal entries.
3. **Every migration needs a rollback note or recovery plan** in the migration PR/docs.
4. **Any VAT or tax logic change requires tests** (unit/integration as relevant).
5. **Auth, permissions, PII, bank data, or tax data changes require extra scrutiny** and explicit security review notes.
6. **Public API, schema, or workflow changes require docs updates** in `README.md` and relevant `docs/**` files.
7. **Do not add dependencies unless necessary.** Prefer existing libraries and platform primitives.
8. **Run relevant checks before concluding work.** For docs-only work, run lightweight checks.

## Commands (from `package.json`)
- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Start production build locally: `npm run start`

## Supabase workflow
- Apply migrations: `supabase db push`
- Keep schema docs synchronized with:
  - `supabase/migrations/*`
  - `src/types/database.ts`

## Change boundaries
- Prefer docs/config updates unless task explicitly requires product code.
- If repo evidence is missing, mark statements as **Assumption** or **TODO**.
