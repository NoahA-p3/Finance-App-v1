# VAT Review Baseline Technical Spec

**Status:** planned.  
**As of:** 2026-03-29.

Related docs: [DK VAT Rules](../domain/DK_VAT_RULES.md), [PRD](../product/PRD.md), [VAT review test plan section](../testing/SPEC_ROADMAP_TEST_PLANS.md#3-vat-review-baseline-test-plan).

## 1) Objective and boundaries
Define a VAT review baseline for deterministic period summaries with explainability and human review workflow support.

In scope:
- VAT code catalogue + company overrides,
- calculation-run persistence for explainability,
- period summary generation/review state.

Out of scope:
- final SKAT filing integration,
- complete legal-form-specific tax engine,
- automatic correction postings.

## 2) Current baseline
- VAT/tax engine is planned; no dedicated VAT tables or APIs are live.
- Domain docs describe VAT concepts, but runtime enforcement is not yet encoded.

## 3) Proposed schema deltas
Planned migration introduces:

1. `vat_codes`
   - `id`, `company_id` nullable (global/system rows allowed), `code`, `description`, `rate_decimal`, `direction`, `is_active`, `created_at`

2. `vat_review_runs`
   - `id`, `company_id`, `period_start`, `period_end`, `engine_version`, `input_hash`, `result_json`, `created_by`, `created_at`

3. `vat_period_reviews`
   - `id`, `company_id`, `period_start`, `period_end`, `output_vat_total`, `input_vat_total`, `net_vat_decimal`, `status` (`draft|in_review|approved|filed`), `approved_by`, `approved_at`

4. `vat_review_events` (append-only)
   - `id`, `company_id`, `vat_period_review_id`, `event_type`, `event_payload_json`, `performed_by`, `created_at`

Constraints:
- decimal/numeric only for VAT totals/rates,
- single active review row per `(company_id, period_start, period_end)`,
- immutable event stream for review state changes.

## 4) API contracts (planned)
- `GET /api/vat/codes` list active VAT codes in scope (global + company overrides).
- `POST /api/vat/reviews/preview` create deterministic calculation preview without side effects.
- `POST /api/vat/reviews/generate` create/update draft period review from persisted data.
- `GET /api/vat/reviews` list VAT review periods.
- `GET /api/vat/reviews/{review_id}` return totals + explainability payload.
- `POST /api/vat/reviews/{review_id}/approve` transition review to approved state with event logging.

Contract requirements:
- responses include explainability metadata (code/rate source and taxable base provenance),
- repeated preview with same input hash and engine version must be deterministic,
- missing legal-form-specific logic must be called out as `TODO`/`Assumption` in code/docs.

## 5) Permissions and RLS baseline
Role expectations:
- `owner`, `admin`, `accountant`: generate previews, create period reviews, approve reviews.
- `member`: read-only on review summaries unless later tightened.

RLS expectations:
- strict company isolation on runs/reviews/events,
- global VAT code visibility allowed where `company_id IS NULL`,
- code overrides mutable only by privileged roles in owning company.

## 6) Migration rollout and rollback notes
Rollout:
1. Add VAT code/run/review/event tables and indexes.
2. Add RLS policies for global-default + company-override visibility.
3. Add deterministic calculation/review service and route handlers.
4. Regenerate DB types.

Rollback:
- disable generate/approve routes first,
- snapshot `vat_review_runs` and `vat_period_reviews` for audit/regression comparison,
- remove tables in reverse dependency order (`events -> reviews -> runs -> codes`),
- after restore, rerun deterministic preview checks for known golden periods.

## 7) Dependencies and delivery links
- Depends on invoice/bill and reconciliation baseline data contracts for complete review coverage.
- Tickets and acceptance checks are tracked in [tasks/EPICS.md](../../tasks/EPICS.md#8-vat-and-tax-engine).
