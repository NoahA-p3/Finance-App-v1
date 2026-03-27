# Archived dashboard component sets

Archived on: 2026-03-27.

These component sets were retired from runtime after an import-graph audit confirmed they are not reachable from `src/app/**` route entrypoints.

Archived folders:
- `retired-dashboard-ui-2026-03-27/` (previously `src/components/dashboard-ui/*`)
- `retired-dashboard-2026-03-27/` (previously `src/components/dashboard/*`)

Retention purpose:
- historical reference while the active dashboard path remains `src/components/finance/*`
- easier recovery if specific legacy UI snippets are needed later

Do not import these archived files into runtime code without explicitly re-validating ownership, data flow, and design parity.
