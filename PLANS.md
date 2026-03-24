# PLANS.md

## Backend gap-closure plan (March 23, 2026)

### Goal
Stabilize the MVP backend on a single canonical schema and hardened API boundaries so persisted finance flows can replace mock-heavy dashboard behavior safely.

### Current behavior
- Runtime backend uses Next.js route handlers in `src/app/api/*` with Supabase server client and owner-scoped queries against `public.transactions`, `public.categories`, and `public.receipts`.
- Auth uses Supabase Auth with middleware/session refresh and `requireUser()` server guard.
- DB has a canonical auth-user keyed path (`auth.users -> public.profiles` + finance tables) **and** a divergent legacy migration branch (`public.users`, `public.accounts`, alternate transactions/receipts columns).
- Dashboard/reports/transactions UI remain mostly mock-data backed despite existing API routes.
- Money is stored as `numeric(12,2)` in SQL, but TypeScript uses `number` and summary math currently uses JS number reductions.

### Top 5 backend priorities
1. **Schema convergence and drift removal (highest risk reducer).**
   - Define canonical migration path and deprecate or isolate legacy `public.users/accounts` branch.
   - Add explicit migration/recovery notes and confirm generated DB types align.
2. **Harden API input contracts for finance endpoints.**
   - Replace raw body spreading in transaction insert path with explicit field validation + allowlist.
   - Enforce server-derived ownership fields and safe defaults at route boundaries.
3. **Wire dashboard/reports to persisted data path.**
   - Replace mock-data finance widgets with server-fetched summaries/transaction data from canonical tables.
   - Keep placeholder features clearly labeled where parity is incomplete.
4. **Introduce decimal-safe domain computation layer.**
   - Prevent float-based accounting aggregates in app logic (report totals, summaries, future VAT/tax rules).
   - Add deterministic fixtures for revenue/expense calculations.
5. **Security and auditability hardening for compliance-sensitive flows.**
   - Add explicit tests/checks for auth isolation, RLS assumptions, and receipt access boundaries.
   - Define append-only correction model (reversal/adjustment) before adding edit-heavy finance features.

### Single highest leverage next implementation slice
**Slice:** Canonical schema alignment pass + API contract hardening for `/api/transactions` (boundary validation + explicit insert payload) with docs/type synchronization.

**Why this slice:**
- It reduces immediate security/data-integrity risk from accepting unchecked request payloads.
- It creates a safer foundation for replacing mock UI with persisted flows.
- It forces resolution of schema/documentation drift that currently risks building against the wrong model.

**Implementation decision for this task:**
- **Not implemented in this pass.**
- Reason: this slice spans migrations/types/API/docs and is not low-risk “small and bounded” until schema branch decisions are finalized.

### Proposed approach (for the next implementation PR)
1. Confirm canonical schema decision in docs (`auth.users -> profiles/transactions/categories/receipts`).
2. Add migration notes that formally mark legacy branch artifacts as deprecated/non-runtime.
3. Regenerate and verify `src/types/database.ts` against canonical schema.
4. Refactor `/api/transactions` POST to validate and map only supported fields.
5. Add focused verification notes for auth/RLS and decimal-handling behavior.

### Affected files (expected next PR)
- `supabase/migrations/*` (schema convergence/deprecation notes)
- `src/types/database.ts`
- `src/app/api/transactions/route.ts`
- `docs/architecture/DATA_MODEL.md`
- `docs/architecture/API_CONTRACTS.md`
- `README.md` (if API/runtime behavior wording changes)

### Risks
- Legacy schema drift may break assumptions during migration ordering.
- API behavior tightening may surface client payload mismatches.
- Decimal precision risk remains until numeric handling is explicit in app-domain logic.
- RLS/security regressions are possible if schema alignment touches table ownership semantics.
- Mock-vs-persisted confusion can increase if docs are not updated in lockstep.

### Verification steps
Baseline:
- `npm run lint`
- `npm run typecheck`

When route/schema/type changes are included:
- `npm run build`
- Manual auth/API smoke checks for `/api/transactions`, `/api/categories`, `/api/receipts`
- Security review notes for ownership enforcement and receipt path isolation

### Assumptions / open questions
- **Assumption:** runtime path should remain auth-user keyed (`auth.users` + `public.profiles`, `transactions`, `categories`, `receipts`).
- **Open question:** should legacy migration artifacts be removed, superseded, or retained only for historical context?
- **Open question:** what minimum persisted reporting outputs are required before replacing current mock dashboard cards/charts?

---

## Schema convergence pass (docs and plan only, March 23, 2026)

### Canonical schema decision
Keep the auth-user keyed runtime path as the only canonical backend model:
- identity: `auth.users` -> `public.profiles`
- finance tables: `public.transactions`, `public.categories`, `public.receipts`
- storage path convention: private `receipts` bucket with per-user folder prefix

### Legacy or divergent artifacts to deprecate (do not extend)
From `supabase/migrations/202603200004_finance_assistant_mvp.sql`:
- `public.users`
- `public.accounts`
- alternate `public.transactions` shape (`merchant`, `account_id`, `category` text)
- alternate `public.receipts` shape (`file_url`, `merchant`, `amount`, `vat`)
- receipt policy coupling ownership through `receipts.transaction_id` instead of `receipts.user_id`

### Proposed migration sequence (safe path)
1. **Decision lock + docs alignment**
   - record canonical model in architecture docs and PLANS.
   - mark divergent migration artifacts as legacy/non-runtime.
2. **Preflight inventory migration**
   - add a non-destructive migration that reports/flags existence of legacy tables/columns/policies in target environments.
   - no table drops in this step.
3. **Compatibility guard migration**
   - add comments and defensive checks that prevent re-creating legacy ownership paths in future migrations.
   - keep runtime path untouched.
4. **Type regeneration and contract sync**
   - regenerate `src/types/database.ts` from canonical schema.
   - ensure docs and API contracts reference only canonical table shapes.
5. **Controlled cleanup migration (after verification window)**
   - remove or archive legacy tables/policies only after confirming no runtime dependencies and taking backups.

### Rollback / recovery notes
- For steps 1-4 (docs/guardrails/type sync), rollback is a standard git revert.
- For step 5 (cleanup), require:
  - pre-drop snapshot/backup,
  - scripted recreation SQL for removed legacy artifacts,
  - post-restore RLS/policy verification checklist.
- If cleanup causes regressions, restore from snapshot and re-apply only canonical-path migrations.

### Type regeneration requirements
- After schema-affecting convergence migrations, regenerate `src/types/database.ts` from Supabase schema.
- Block merge if generated types still include deprecated legacy runtime entities.
- Verify profile fields and finance table columns in types match canonical migration state.

### Risks
- Hidden environment drift where legacy tables exist with production data.
- Breaking historical scripts or ad-hoc queries that still point to legacy tables.
- Incomplete policy restoration if rollback is attempted without scripted recovery.

### Assumptions
- Runtime code and active APIs continue to use canonical auth-user keyed tables only.
- Legacy artifacts are either unused or can be archived before hard deletion.


## Non-destructive schema convergence prep (implementation slice)

### Goal
Reduce schema drift risk without altering runtime behavior or dropping legacy artifacts.

### Low-risk guardrails to add now
1. Explicitly label canonical runtime schema path in architecture docs and planning docs.
2. Add migration-adjacent guidance that legacy branch tables are deprecated for new work.
3. Define generated type regeneration workflow and required drift checks.
4. Audit and document code references that still imply legacy schema usage (if any).

### Out of scope for this slice
- dropping/renaming any table
- destructive cleanup of legacy artifacts
- broad runtime data-access rewrites
- business-logic changes

### Verification for this slice
- `npm run typecheck`
- `npm run build`
- `npm run lint` only if non-interactive in current environment

### Expected outputs
- docs and plan updates only
- migration-adjacent guardrail notes (non-executable)
- drift list and next implementation slice recommendation

### Execution status in this environment
- Inventory mechanism implemented as migration view: `public.legacy_schema_inventory`.
- Supabase CLI is not available in this container (`supabase: command not found`), so full generated-type regeneration was blocked.
- Required command when CLI is available:
  - Local linked DB: `supabase gen types typescript --local > src/types/database.ts`
  - Remote project: `supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts`
- Manual low-risk reconciliation applied for clear canonical drift (`profiles.username` in `src/types/database.ts`).

