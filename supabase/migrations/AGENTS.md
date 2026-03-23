# AGENTS.md

## Scope
Schema, RLS, functions, triggers, and storage policies in `supabase/migrations/*`.

## Rules
1. Treat migrations as the source of truth for schema behavior.
2. Do not extend divergent legacy schema branches unless the task explicitly targets them.
3. Every migration must include rollback notes or a recovery plan.
4. Preserve RLS, ownership constraints, and receipt storage isolation.
5. Call out any generated type drift requiring updates to `src/types/database.ts`.
6. Favor additive and auditable finance data changes over destructive mutation patterns.
7. Document runtime behavior changes in the relevant architecture, domain, or product docs.

## Review focus
- schema branch confusion
- broken RLS
- unsafe backfills
- destructive changes
- missing recovery steps
- type drift
