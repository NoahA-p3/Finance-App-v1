# API Contracts (Current)

Related docs: [System Overview](./SYSTEM_OVERVIEW.md), [Security Rules](../security/SECURITY_RULES.md).

Current backend pattern: Next.js route handlers in `src/app/api/*` using Supabase server client directly.

## Auth APIs

### `POST /api/auth/signup`
- Purpose: create new user account.
- Auth boundary: public endpoint.
- Inputs:
  - JSON: `email`, `password`, `firstName`, `lastName`.
- Outputs:
  - `201`: `{ user, requiresEmailConfirmation }`
  - `400`: `{ error }`
- Files: `src/app/api/auth/signup/route.ts`, `src/lib/supabase/server.ts`.
- Validation/side effects:
  - requires all fields.
  - writes user metadata for profile trigger sync.

### `POST /api/auth/login`
- Purpose: sign in existing user.
- Auth boundary: public endpoint.
- Inputs: JSON `email`, `password`.
- Outputs:
  - `200`: `{ user }`
  - `400/401`: `{ error }`
- Files: `src/app/api/auth/login/route.ts`.

### `POST /api/auth/logout`
- Purpose: terminate session.
- Auth boundary: authenticated session expected.
- Inputs: none.
- Outputs:
  - `200`: `{ success: true }`
  - `400`: `{ error }`
- Files: `src/app/api/auth/logout/route.ts`.

## Transaction APIs

### `GET /api/transactions`
- Purpose: list current user transactions by date desc.
- Auth boundary: authenticated user required.
- Inputs: none.
- Outputs:
  - `200`: transaction array (`select("*")`)
  - `401/400`: `{ error }`
- Files: `src/app/api/transactions/route.ts`.
- Side effects: none.

### `POST /api/transactions`
- Purpose: create transaction for current user.
- Auth boundary: authenticated user required.
- Inputs: JSON body merged into insert payload + enforced `user_id`.
- Outputs:
  - `201`: inserted transaction row
  - `401/400`: `{ error }`
- Files: `src/app/api/transactions/route.ts`.
- Validation notes:
  - relies mostly on DB constraints; limited request-level validation today.

## Category APIs

### `POST /api/categories`
- Purpose: create user category.
- Auth boundary: authenticated user required.
- Inputs: JSON `{ name }`.
- Outputs: created category row or error.
- Files: `src/app/api/categories/route.ts`.

### `DELETE /api/categories?id=<id>`
- Purpose: delete user category.
- Auth boundary: authenticated user required.
- Inputs: query param `id`.
- Outputs: `{ success: true }` or error.
- Files: `src/app/api/categories/route.ts`.

## Receipt API

### `POST /api/receipts`
- Purpose: upload receipt file and persist path.
- Auth boundary: authenticated user required.
- Inputs: multipart/form-data with `file`.
- Outputs:
  - `201`: `{ id, path }`
  - `401/400`: `{ error }`
- Files: `src/app/api/receipts/route.ts`.
- Side effects:
  - uploads file to `receipts` bucket at `${user.id}/${timestamp}-${name}`.
  - inserts row in `public.receipts`.

## Additional backend surfaces
- Middleware auth redirect behavior: `src/middleware.ts`, `src/lib/supabase/middleware.ts`.
- Supabase trigger/function contracts in SQL migrations (`handle_new_user`, `set_updated_at`, `email_for_login_identifier`).

## Missing or informal contracts (gaps)
- No OpenAPI/typed API schema.
- No idempotency or concurrency contract for mutable operations.
- No explicit error code taxonomy.
- No webhook/background job contract currently.
