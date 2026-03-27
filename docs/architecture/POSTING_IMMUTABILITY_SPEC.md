# Posting Immutability and Reversal Technical Spec

Related docs: [Data Model](./DATA_MODEL.md), [API Contracts](./API_CONTRACTS.md), [DK accounting domain notes](../domain/DK_ACCOUNTING_RULES.md), [Security rules](../security/SECURITY_RULES.md).

## Scope
This spec defines the MVP-safe accounting posting foundation for:
- posting state model,
- reversal and adjustment mechanics,
- period lock semantics,
- immutable audit-event schema.

This is an infrastructure baseline and does **not** claim full Danish compliance automation.

## 1) Posting state model

### Entity model (implemented in migration)
- `public.journal_entries`
  - `status`: `draft | posted | reversed`
  - `source_transaction_id`: optional link to originating `public.transactions` row
  - `reversal_of_journal_entry_id`: optional self-reference for reversal lineage
  - `posting_date`, `posted_at`, `posted_by`, `reversed_at`, `reversed_by`, `reversal_reason`
- `public.journal_lines`
  - immutable line-level debit/credit representation per entry
  - exact amount type uses `numeric(12,2)` (no float storage)

### Allowed state transitions
- `draft -> posted`
- `posted -> reversed` (only through explicit reversal workflow)
- `draft` edits are allowed before posting finalization.
- `posted` or `reversed` entries are immutable to update/delete mutations.

### Runtime posting behavior (MVP)
- Posting endpoint creates a `posted` entry directly from a source transaction.
- The posting operation writes balanced debit/credit lines.
- Account mapping is currently simplified (`operating_expense`/`operating_revenue` and `cash`).
  - **Assumption:** account-code mapping is placeholder-level until chart-of-accounts logic is introduced.

## 2) Reversal and adjustment mechanics

### Reversal mechanics
- Reversal creates a **new posted entry** with:
  - `reversal_of_journal_entry_id = source_posting_id`
  - same posting date as source entry
  - opposite directions for each source line (debit <-> credit)
- Original source entry is moved to `status = reversed` and annotated with:
  - `reversed_at`, `reversed_by`, `reversal_reason`
- Exactly one reversal per source entry is enforced with a unique partial index on `reversal_of_journal_entry_id`.

### Adjustment mechanics
- Adjustments should be represented as a new posting (and optional reversal pair), not destructive edits.
- Transaction edits/deletes are blocked once a posted/reversed journal entry references the transaction.
- This enforces append-only behavior for compliance-relevant history.

## 3) Period lock semantics

### Entity model
- `public.period_locks`
  - `company_id`, `start_date`, `end_date`, `reason`, `locked_at`, `locked_by`

### Lock behavior
- Posting and reversal operations reject when posting date falls inside any lock range (`start_date <= posting_date <= end_date`) for active company.
- Locks are currently additive records (no unlock endpoint in this slice).
  - **TODO:** define explicit unlock workflow with role constraints and immutable unlock audit events.

## 4) Immutable audit-event schema

### Entity model
- `public.audit_events`
  - `company_id`
  - `actor_user_id`
  - `entity_table`, `entity_id`
  - `event_type`
  - `occurred_at`
  - `metadata jsonb`

### Immutability guarantees
- `audit_events` is append-only: updates and deletes are blocked by trigger.
- Posting actions record audit events:
  - `posting.posted`
  - `posting.reversed`
  - `period.locked`
- Audit payloads are structured JSON metadata and must avoid sensitive secret/token content.

## 5) API/service boundaries

### Service boundary (`src/lib/postings/service.ts`)
Responsibilities:
- posting input validation,
- period lock checks,
- journal entry and line creation,
- reversal orchestration,
- audit-event append writes.

### API boundaries (`src/app/api/postings/*`)
- `GET /api/postings`: list journal entries for active company membership.
- `POST /api/postings`: post transaction (`transaction_id`) into journal.
- `POST /api/postings/{posting_id}/reverse`: reverse a posted entry (`reason` required).
- `GET /api/postings/period-locks`: list period locks for active company.
- `POST /api/postings/period-locks`: create period lock (`start_date`, `end_date`, optional `reason`).

All endpoints:
- require authenticated user,
- resolve active company membership server-side,
- never trust client ownership fields.

## 6) Recovery and rollback
- Migration includes rollback SQL and recovery notes for new posting/audit entities.
- If rollback is required:
  1. snapshot posting/audit tables,
  2. execute rollback SQL,
  3. reapply migration + restore snapshot data if rollback was accidental,
  4. re-verify immutability triggers and period lock enforcement.

## 7) Out of scope
- Full Danish VAT/tax posting automation.
- Immutable period unlock governance workflow.
- Multi-step draft approval model.
- General ledger reporting package and period close automation.
