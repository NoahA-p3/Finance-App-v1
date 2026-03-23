# AGENTS.md

## Repo purpose
Finance Assistant MVP for Danish freelancers and small businesses, including enkeltmandsvirksomhed and ApS, built as a single Next.js app with Supabase.

## Current architecture
- Single Next.js App Router app at repo root
- Frontend pages and API route handlers in `src/app`
- Shared libraries in `src/lib`
- Supabase Auth, Postgres, and Storage
- Database migrations in `supabase/migrations`
- Generated DB types in `src/types/database.ts`

## Current product state
This repo is an MVP foundation, not a finished accounting system.
Implemented or partial today:
- auth and protected routes
- profiles
- transactions
- categories
- receipts
- dashboard and reports scaffolding

Planned or not yet fully implemented:
- VAT engine
- tax rule engine
- legal-form-specific logic
- compliance-grade reporting
- immutable posting model
- period locking
- audit event system
- multi-user role model

Do not describe planned capabilities as implemented.

## Canonical runtime path
Treat this as the active runtime path unless repo evidence proves otherwise:
- identity: `auth.users` -> `public.profiles`
- finance tables: `public.transactions`, `public.categories`, `public.receipts`
- auth gating: `src/middleware.ts`, `src/lib/supabase/middleware.ts`, `src/lib/auth.ts`
- API layer: `src/app/api/*`

There are legacy or divergent schema artifacts in migrations. Do not extend older `users` or `accounts` patterns unless the task explicitly targets legacy support.

## Sources of truth
Read the relevant files before changing behavior:
- architecture: `docs/architecture/*`
- domain rules: `docs/domain/*`
- product scope and requirements: `docs/product/*`
- security rules: `docs/security/SECURITY_RULES.md`
- testing rules and datasets: `docs/testing/*`
- schema and policies: `supabase/migrations/*`
- generated schema contract: `src/types/database.ts`
- setup and repo context: `README.md`

If code, migrations, generated types, and docs disagree, call it out clearly in the final summary.

## Critical domain invariants
1. Money values must use exact decimal handling. Never use float math for accounting logic.
2. Posted or compliance-relevant accounting records must be treated as append-only in behavior. Prefer reversal or adjustment patterns over destructive edits.
3. VAT, tax, bookkeeping, and reconciliation logic must preserve auditability and traceability.
4. PII, bank data, tax data, auth data, and receipt data are sensitive. Minimize exposure and avoid sensitive logging.
5. Do not invent Danish accounting or VAT rules. If repo evidence is missing, mark the gap as `Assumption` or `TODO`.
6. Legal-form-specific behavior for enkeltmandsvirksomhed and ApS is mostly planned, not implemented. Do not assume role, workflow, or reporting differences already exist.

## Working rules
1. Follow existing patterns before introducing new abstractions.
2. Prefer small, cohesive changes. Avoid unrelated refactors.
3. Do not add dependencies unless necessary. Prefer existing libraries and platform primitives.
4. Public API, schema, workflow, or user-visible behavior changes require docs updates in `README.md` and relevant `docs/**`.
5. Be explicit about mock data versus persisted data. Do not present mock-backed behavior as production-complete.
6. For route handlers, validate inputs at the boundary. Do not trust client-supplied ownership fields.
7. For finance logic, protect decimal correctness, audit trail expectations, and future reversibility.

## Planning rules
Create or update `PLANS.md` before coding when the task involves:
- non-trivial backend logic
- schema or migration changes
- auth or permission changes
- VAT, tax, accounting, or reporting logic
- receipt or storage flow changes
- replacing mock-backed flows with persisted flows
- multi-file refactors

A plan should include:
- goal
- current behavior
- proposed approach
- affected files
- risks
- verification steps
- assumptions or open questions

## Verification
Run relevant checks before concluding work.

Baseline:
- `npm run lint`
- `npm run typecheck`

Also run when relevant:
- `npm run build`

Required verification:
- VAT or tax logic changes require targeted tests or clearly documented missing-test gaps
- auth, permissions, PII, bank data, tax data, or RLS changes require explicit security review notes
- migration changes require rollback guidance or recovery notes
- schema, API, or route changes should run `npm run build`
- docs-only work should still run lightweight checks when possible

If the repo does not yet contain executable tests for the changed area, say so clearly and list the missing verification.

## Testing guidance
Use `docs/testing/TEST_STRATEGY.md` and `docs/testing/GOLDEN_DATASETS.md` as the standard for what should be covered.
Prioritize these areas:
- ledger integrity and immutability controls
- VAT and tax calculations
- report totals versus transactions
- auth and cross-tenant isolation
- migration safety
- profile and receipt permission boundaries

Use deterministic fixtures and decimal-safe amounts.

## Supabase workflow
- Apply migrations with `supabase db push`
- Keep schema-related docs aligned with:
  - `supabase/migrations/*`
  - `src/types/database.ts`

Before changing schema, confirm the task targets the canonical runtime schema and not a divergent legacy branch.

## Review guidelines
Treat these as high priority issues:
- float math in accounting logic
- destructive edits to accounting records that should remain traceable
- changes that deepen legacy schema drift
- missing permission checks or broken RLS assumptions
- unsafe handling or logging of PII, bank data, tax data, tokens, secrets, or private receipt paths
- VAT or tax logic changes without tests or explicit test-gap notes
- API contract changes without docs updates
- schema changes without migration notes or recovery guidance
- new features wired only to mock data when persisted behavior is expected

## Definition of done
A task is done only when:
- the requested change is implemented
- relevant checks pass
- tests are added or updated where required, or missing coverage is explicitly documented
- docs are updated when behavior changed
- migration and security notes are included when relevant
- assumptions, risks, and follow-up work are called out clearly

## Change boundaries
- Prefer docs or config changes unless the task explicitly requires product code.
- Preserve backward compatibility unless the task explicitly allows breaking changes.
- Do not broaden scope from narrow fixes into architecture rewrites unless the plan says so.
