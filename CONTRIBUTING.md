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
