# Schema Guardrails (Non-destructive)

This note is migration-adjacent guidance only. It does **not** change runtime behavior.

## Canonical runtime schema path
- identity: `auth.users` -> `public.profiles`
- finance: `public.transactions`, `public.categories`, `public.receipts`
- company context: `public.companies`, `public.company_memberships`, `public.company_settings`
- RBAC: `public.roles`, `public.permissions`, `public.role_permissions`, `public.company_invitations`
- entitlements/billing: `public.plans`, `public.plan_entitlements`, `public.company_subscriptions`, `public.usage_counters`

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

## Inventory query
After applying migrations, run:
```sql
select * from public.legacy_schema_inventory order by artifact_key;
```

## Generated type workflow
Run regeneration from repo root (requires Supabase CLI and canonical DB state):

```bash
supabase gen types typescript --local > src/types/database.ts
```

If using a linked remote project instead of local DB:

```bash
supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```

## Checksum and contract verification workflow
After regeneration, record and verify a deterministic checksum plus canonical/legacy contract checks:

```bash
sha256sum src/types/database.ts
```

```bash
# Structural sanity: exactly one Database contract section.
rg -n "^export type Database =" src/types/database.ts

# Canonical tables expected in active app contract.
rg -n "^      (profiles|transactions|categories|receipts|companies|company_memberships|company_settings|roles|permissions|role_permissions|company_invitations|plans|plan_entitlements|company_subscriptions|usage_counters):" src/types/database.ts

# Legacy runtime entities must not be present in active contract.
rg -n "^      (users|accounts):" src/types/database.ts && echo "unexpected legacy entity" && exit 1 || true
```

If CLI is unavailable in the current environment, do **not** handcraft large type edits. Document the blocker and run the verification checks against the existing generated file.
