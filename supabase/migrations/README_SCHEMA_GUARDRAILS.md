# Schema Guardrails (Non-destructive)

This note is migration-adjacent guidance only. It does **not** change runtime behavior.

## Canonical runtime schema path
- identity: `auth.users` -> `public.profiles`
- finance: `public.transactions`, `public.categories`, `public.receipts`

## Legacy artifacts (do not extend)
Legacy/divergent artifacts currently visible in one branch migration:
- `public.users`
- `public.accounts`
- alternate `transactions`/`receipts` column shapes

Do not build new runtime features against legacy artifacts unless a task explicitly targets legacy compatibility.

## Non-destructive convergence prep
Before destructive cleanup migrations:
1. Inventory legacy table usage in target environments.
2. Regenerate and verify `src/types/database.ts` against canonical schema.
3. Prepare rollback assets (snapshot + recreation SQL + policy verification checklist).
