# Contributing

## Local-only artifacts and repository hygiene

This repository expects local dependency and build artifacts to stay untracked.

Do not commit local artifacts such as:
- `node_modules/`
- `.next/`, `out/`, `dist/`, `coverage/`
- local environment files (`.env`, `.env.local`, `.env.*` except `.env.example`)
- local logs (`*.log`, `npm-debug.log*`, `yarn-*.log*`, `pnpm-debug.log*`)
- editor/OS/tooling caches (for example `.DS_Store`, `.idea/`, `.vscode/`, `.cache/`, `.turbo/`)

Before opening a PR, verify hygiene:

```bash
npm install
npm run build
git status --short
```

Expected result: `git status --short` should only show intentionally changed tracked files.

## Required CI checks

Pull requests are required to pass the repository CI workflow (`.github/workflows/pr-ci.yml`), which runs:

- `npm ci`
- `npm run check:migration-order`
- `npm run check:legacy-runtime-references`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

The migration-order check ensures `supabase/migrations/MIGRATION_ORDER.md` includes every SQL file under `supabase/migrations/`.

The legacy runtime-reference check fails PRs when runtime app code in `src/app/**` or `src/lib/**` references legacy entities/columns (`public.users`, `public.accounts`, `transactions.account_id`, `receipts.file_url`). Legacy references are allowed in allowlisted documentation and migration paths (`docs/**`, `supabase/migrations/**`).

### Intentional bypass for explicit legacy-support work

If a PR intentionally adds runtime legacy references for explicit legacy-support work, apply the PR label `ci:allow-legacy-runtime`.

In CI, that label sets `ALLOW_LEGACY_RUNTIME_REFERENCES=1` for the guard step so the check is bypassed for that run. Include a clear justification in the PR description and remove the label once legacy-support work is complete.

## Integration CI policy (Supabase local)

The PR workflow also includes a separate **Integration (Supabase local)** job that installs Supabase CLI and runs:

- `npm run test:integration:local`

To keep CI costs predictable, this integration job is mandatory only when either condition is true:

1. PR changes include any of these paths:
   - `src/app/api/**`
   - `src/lib/postings/**`
   - `supabase/migrations/**`
   - `tests/integration/**`
   - `scripts/run-supabase-integration-tests.mjs`
   - `.github/workflows/pr-ci.yml`
2. The PR is labeled `ci:full-integration` (manual override to force the job).

When the integration job runs, CI uploads artifacts (`integration-local-logs`) containing:
- full integration command output,
- Supabase status output,
- Supabase local logs.

If your PR touches auth, RLS, posting, or migration behavior but does not match path filters, apply `ci:full-integration`.
