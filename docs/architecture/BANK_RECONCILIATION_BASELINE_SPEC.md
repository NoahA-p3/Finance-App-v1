# Bank/Reconciliation Baseline Technical Spec

**Status:** planned.  
**As of:** 2026-03-29.

Related docs: [System Overview](./SYSTEM_OVERVIEW.md), [Technical Modules](./TECHNICAL_MODULES.md), [Security Rules](../security/SECURITY_RULES.md), [Bank/reconciliation test plan section](../testing/SPEC_ROADMAP_TEST_PLANS.md#2-bankreconciliation-baseline-test-plan).

## 1) Objective and boundaries
Define an MVP reconciliation baseline that links bank-origin transaction entries to invoices/bills/expenses with traceable match decisions.

In scope:
- reconciliation session lifecycle,
- deterministic match record persistence,
- unresolved/open-item queue endpoints.

Out of scope:
- direct bank provider ingestion adapter,
- ML auto-matching,
- statement document OCR extraction.

## 2) Current baseline
- Transactions/categories/receipts exist.
- No first-class reconciliation session/match schema exists.
- No reconciliation route handlers exist in `src/app/api/reconciliation/*`.

## 3) Proposed schema deltas
Planned migration introduces:

1. `bank_connections` (minimal metadata only)
   - `id`, `company_id`, `provider_key`, `connection_status`, `last_sync_at`, `created_by`, `created_at`
   - note: stores connector metadata, not raw credentials.

2. `bank_statement_entries`
   - `id`, `company_id`, `bank_connection_id`, `entry_date`, `booking_text`, `amount_decimal`, `currency_code`, `external_ref`, `hash`
   - unique dedupe key on `(company_id, bank_connection_id, hash)`.

3. `reconciliation_sessions`
   - `id`, `company_id`, `period_start`, `period_end`, `status` (`open|review|closed`), `created_by`, `closed_by`, `created_at`, `closed_at`

4. `reconciliation_matches`
   - `id`, `company_id`, `session_id`, `left_ref_type`, `left_ref_id`, `right_ref_type`, `right_ref_id`, `matched_amount_decimal`, `match_status` (`proposed|confirmed|rejected`), `confidence_score_decimal`, `created_by`, `created_at`

5. `reconciliation_events` (append-only)
   - `id`, `company_id`, `session_id`, `event_type`, `event_payload_json`, `performed_by`, `created_at`

Constraints:
- decimal/numeric for amounts and confidence,
- company-local tenancy fields mandatory,
- immutable event log for key lifecycle transitions.

## 4) API contracts (planned)
- `POST /api/reconciliation/sessions` create session by period.
- `GET /api/reconciliation/sessions` list sessions and status counts.
- `POST /api/reconciliation/sessions/{session_id}/matches` create or confirm match decisions.
- `POST /api/reconciliation/sessions/{session_id}/close` close session after open-item checks.
- `GET /api/reconciliation/open-items` return unresolved statement entries and unmatched invoice/bill balances.

Boundary requirements:
- validate identifier types and company scope server-side,
- reject cross-company references,
- ensure close endpoint blocks when unresolved critical mismatches remain.

## 5) Permissions and RLS baseline
Role expectations:
- `owner`, `admin`, `accountant`: create sessions, confirm/reject matches, close sessions.
- `member`: read-only on reconciliation summaries/open items.

RLS expectations:
- strict `company_id` row filtering for all tables,
- write actions gated by role membership,
- delete denied on `reconciliation_events` and closed-session matches.

Security/PII note:
- do not persist full bank account identifiers in logs/payloads;
- redact external refs in audit logs when needed.

## 6) Migration rollout and rollback notes
Rollout:
1. Introduce reconciliation tables with indexes and RLS.
2. Add route handlers and service-layer validators.
3. Add deterministic open-items query and pagination contract.

Rollback:
- disable reconciliation write endpoints first,
- export `reconciliation_events` and `reconciliation_matches` for audit retention,
- drop dependent tables in reverse order (`events -> matches -> sessions -> statements -> connections`).
- recovery validation should compare unresolved-open-item counts pre/post rollback snapshot.

## 7) Dependencies and delivery links
- Depends on invoicing lifecycle baseline for AR/AP matching references.
- Depends on transaction ingestion data quality for statement-entry matching.
- Tickets and acceptance checks are tracked in [tasks/EPICS.md](../../tasks/EPICS.md#5-transaction-ingestion).
