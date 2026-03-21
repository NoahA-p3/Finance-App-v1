# Data Model

Source inputs inspected:
- `supabase/migrations/*.sql`
- `src/types/database.ts`
- API queries in `src/app/api/*` and `src/lib/data.ts`

Related docs: [System Overview](./SYSTEM_OVERVIEW.md), [DK Accounting Rules](../domain/DK_ACCOUNTING_RULES.md).

## Current entities (observed)

### `public.profiles`
- Purpose: app profile mirror of auth user.
- Key fields: `id` (auth user FK), `email`, `first_name`, `last_name`, phone fields, timestamps.
- Constraints:
  - `id` PK to `auth.users(id)`.
  - unique index on `lower(username)` when non-null.
- RLS: user can select/insert/update own profile.

### `public.transactions`
- Purpose: core income/expense records.
- Key fields: `id`, `user_id`, `category_id`, `receipt_id`, `type`, `description`, `amount numeric(12,2)`, `date`, `created_at`.
- Constraints:
  - `type` in (`expense`, `revenue`).
  - non-negative amount check.
- Relationships:
  - belongs to auth user (`user_id`).
  - optional category link.
  - optional receipt link.
- RLS: user manages own rows.

### `public.categories`
- Purpose: user-defined transaction categories.
- Key fields: `id`, `user_id`, `name`, `created_at`.
- RLS: user manages own rows.

### `public.receipts`
- Purpose: metadata link to files stored in Supabase Storage.
- Key fields (active branch): `id`, `user_id`, `path`, `transaction_id`, `created_at`.
- Relationships:
  - belongs to auth user.
  - optional link to `transactions`.
- RLS: user manages own rows.

### Supabase Storage `receipts` bucket
- Private bucket.
- Policies enforce folder prefix equals `auth.uid()` for CRUD operations.

## Legacy / conflicting schema branch (observed)
`202603200004_finance_assistant_mvp.sql` also defines `public.users`, `public.accounts`, and an alternate `transactions/receipts` shape.

Status: appears older or divergent from currently queried tables.

**Assumption:** active runtime path is auth-user keyed schema matching `src/types/database.ts` and route handlers.

## Relationships (current runtime assumption)
- `auth.users (1) -> (1) public.profiles`
- `auth.users (1) -> (n) public.transactions`
- `auth.users (1) -> (n) public.categories`
- `auth.users (1) -> (n) public.receipts`
- `public.categories (1) -> (n) public.transactions` (optional FK)
- `public.receipts (1) <-> (0..1) public.transactions` via nullable references

## Finance-specific modeling concerns
- DB uses decimal-compatible `numeric(12,2)` for amount storage.
- TypeScript generated type maps `amount` to `number` (precision risk if used in arithmetic without decimal library).
- No immutable posting state or journal-balance constraints.
- No explicit VAT fields in active schema.
- No document metadata schema beyond storage path and optional linkage.
- No audit-event table for sensitive changes.

## Planned entities (not implemented)
- `businesses` / organization tenant model.
- `memberships` + role/permission tables.
- Double-entry ledger tables (journal header + lines).
- VAT configuration and VAT posting tables.
- period close/lock tables.
- report snapshot/export tracking tables.

Mark these as planned until backed by migrations.
