# AGENTS.md

## Scope
API route handlers under `src/app/api/*`.

## Rules
1. Validate request inputs at the boundary.
2. Enforce auth before data access.
3. Never trust client-supplied `user_id`, role, or ownership fields.
4. Preserve the existing response shape unless the task explicitly changes the API contract.
5. Prefer narrow inserts and updates over spreading raw request bodies into database writes.
6. For finance endpoints, protect decimal correctness, traceability, and future reversibility.
7. For receipt flows, preserve private bucket behavior and per-user object isolation.
8. If an endpoint is still mock-backed or partial, state that clearly in docs and summaries.

## Verification
- `npm run lint`
- `npm run typecheck`
- `npm run build` for route, schema, or import changes

## Review focus
- auth bypass
- missing validation
- unsafe file handling
- contract drift
- sensitive data leakage
