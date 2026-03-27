# API Contracts

Related docs: [Technical Module Boundaries](./TECHNICAL_MODULES.md), [Data Model](./DATA_MODEL.md), [System Overview](./SYSTEM_OVERVIEW.md), [Product Module Map](../product/PRODUCT_MODULE_MAP.md).

This document is a technical API map organized by the same 12-module product structure.

## API style and conventions (target)
- Resource-oriented HTTP endpoints.
- Company-scoped resources primarily under `/companies/{company_id}/...`.
- Auth/session resources under `/auth/*` and user profile/session resources under `/me*`.
- Webhook receiver endpoints for external providers where relevant.

## Current runtime implementation (today)
Currently implemented route handlers in `src/app/api/*`:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/resend-verification`
- `GET /api/me/sessions`
- `DELETE /api/me/sessions/{session_id}`
- `GET /api/me/account`
- `GET /api/me/devices`
- `GET /api/me/login-alerts`
- `GET /api/me/mfa`
- `POST /api/me/mfa/enroll`
- `POST /api/me/mfa/challenge`
- `POST /api/me/mfa/verify`
- `DELETE /api/me/mfa/{factor_id}`
- `GET /api/transactions`
- `POST /api/transactions`
- `POST /api/categories`
- `DELETE /api/categories?id=<id>`
- `GET /api/receipts`
- `POST /api/receipts`
- `GET /api/companies`
- `POST /api/companies`
- `PATCH /api/companies`
- `GET /api/companies/members`
- `PATCH /api/companies/members`
- `GET /api/companies/invitations`
- `POST /api/companies/invitations`
- `POST /api/companies/switch`
- `GET /api/companies/cvr?cvr=<8-digit>`
- `GET /api/entitlements`
- `POST /api/entitlements/admin/seed`

All other endpoint groupings in this document are target contracts for phased implementation.


### Auth endpoint behavior notes (current runtime)
- Signup flow:
  - `POST /api/auth/signup` returns actionable setup guidance when Supabase rejects `emailRedirectTo` configuration.
  - Route retries signup without `emailRedirectTo` when redirect-url configuration fails, so account creation can still succeed while configuration is corrected.
  - Existing email conflicts return `409` with a non-sensitive sign-in/reset hint.
- Password reset flow is Supabase Auth-native:
  - `POST /api/auth/forgot-password` always returns a generic success message when request format is valid to avoid account enumeration.
  - `POST /api/auth/reset-password` updates password for an active recovery session only.
- Verification resend flow:
  - `POST /api/auth/resend-verification` returns minimal, non-sensitive errors and generic success messaging.
- Session management flow:
  - `GET /api/me/sessions` returns only the authenticated user's active sessions.
  - `DELETE /api/me/sessions/{session_id}` validates session id format, enforces authenticated ownership, and blocks revoking the current session.
  - Session revoke responses avoid leaking cross-user session existence details.
- Account security summary flow:
  - `GET /api/me/account` returns authenticated profile + security status snapshot (email verification, last login, active session count, MFA enabled).
  - `GET /api/me/devices` returns authenticated device/session history derived from Auth sessions.
  - `GET /api/me/login-alerts` returns recent non-current-session login activity alerts for in-app review.
  - **Current delivery channel:** in-app account surface only (no outbound email/SMS notification subsystem is implemented in this repo today).
- MFA TOTP management flow:
  - `GET /api/me/mfa` returns enrolled factors for the authenticated user.
  - `POST /api/me/mfa/enroll` creates a TOTP factor enrollment and returns setup URI/QR payload.
  - `POST /api/me/mfa/challenge` and `POST /api/me/mfa/verify` complete enrollment verification.
  - `DELETE /api/me/mfa/{factor_id}` disables an enrolled factor.
- No local password tables are used; identity remains Supabase Auth (`auth.users`).
- Company profile bootstrap flow:
  - `GET /api/companies` returns the authenticated user's current company profile/settings if membership exists, otherwise `company: null`.
  - `POST /api/companies` creates a first company + owner membership for authenticated users without an existing company membership.
  - `PATCH /api/companies` requires `company.settings.manage` permission (granted to `owner` in baseline).
  - `GET /api/companies/members` requires `company.members.read`.
  - `PATCH /api/companies/members` requires `company.members.manage` and updates member role assignments.
  - `GET /api/companies/invitations` lists pending invitations and requires `company.invitations.read`.
  - `POST /api/companies/invitations` creates pending invitations and requires `company.invitations.manage`.
  - `POST /api/companies/switch` validates target membership and persists `profiles.active_company_id`.
  - `GET /api/companies/cvr?cvr=<8-digit>` uses an adapter interface; when provider integration is unavailable it returns explicit manual fallback guidance.
  - `GET /api/entitlements` returns active company plan, entitlement limits, and usage snapshots.
  - `POST /api/entitlements/admin/seed` allows owner-only internal subscription seeding/switching for rollout/testing (provider-agnostic source).
  - Active company context is resolved from `profiles.active_company_id` (with safe first-membership fallback).
  - Company-scoped finance endpoints (`/api/transactions`, `/api/categories`, `/api/receipts`) resolve and enforce active-company membership plus `company_id` filtering.
  - `GET /api/receipts` returns persisted receipt metadata (`id`, `path`, `created_at`, `transaction_id`) for the active company.
  - Receipt preview/download links are not returned directly; private-path access should use a controlled signed-URL flow.
  - Baseline seeded roles: `owner`, `staff`, `read_only`; advanced roles are feature-flagged placeholders until matrix finalization.
  - Cross-tenant reads/writes are blocked by combined API membership checks and table RLS policies.
  - `POST /api/transactions` enforces plan limits server-side for `monthly_vouchers` and `rolling_turnover_12m_dkk`; responses include `entitlement_warning` and soft-lock `upgrade_prompt` payloads when thresholds are reached.
  - Enforcement rollout is feature-flagged by plan tier via `ENABLE_ENTITLEMENT_ENFORCEMENT_PLAN_KEYS`.


## Module-aligned endpoint groupings (target)

### 1) User and Company Management
- Auth and account:
  - `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/logout-all`
  - password/email verification and MFA endpoints
  - `GET /me`, `PATCH /me`, `GET /me/sessions`, `DELETE /me/sessions/{session_id}`
- Roles/memberships:
  - company members CRUD, invitations, role CRUD, `GET /permissions`
- Company profile/settings:
  - company CRUD, settings, branding, company-switch endpoint, CVR lookup endpoint
- Billing/entitlements:
  - plans listing, subscription lifecycle endpoints, usage and entitlement endpoints

### 2) Contacts and Master Data
- Contacts:
  - contact CRUD, import/export, timeline, balances
- Products and price lists:
  - product CRUD, import/export, price-list CRUD

### 3) Sales, Quotes, Orders, and Invoicing
- Sales documents:
  - sales document CRUD, send/view/convert/approve actions, attachment upload, PDF and timeline retrieval
- Recurring schedules:
  - schedule CRUD, pause/resume/run-now, run history
- Collections:
  - overdue queue, reminder create/list, debt-collection handoff and case listing

### 4) Accounting Core
- Ledger and periods:
  - account CRUD, journal entry list/create/detail, reversal endpoint
  - fiscal period list/create/lock/unlock
- Cashbook:
  - cashbook entry CRUD, posting-template CRUD, posting import
- VAT:
  - VAT code CRUD, VAT return prepare/detail/transaction drilldown/submit/export
- Reports and assets:
  - financial report resources, report exports, saved reports CRUD, fixed-asset workflow endpoints

### 5) Receipts, Expenses, and Bookkeeping Automation
- Files and receipt inbox:
  - file list/upload/detail/delete, receipt inbox, extraction trigger/detail
- Expenses:
  - expense CRUD, posting action, expense-from-file creation
- Bank and reconciliation:
  - bank connection resources, sync/import actions, transaction suggestions/match/split/undo, reconciliation view
- Automation and assistant:
  - automation rules CRUD, suggestions feed accept/reject, assistant tasks list/update/complete

### 6) Payments and Checkout
- Payment provider accounts CRUD
- payment link creation per sales document
- payment transaction listing per sales document
- payment provider webhook endpoint
- manual mark-paid endpoint

### 7) Payroll
- Employee resource CRUD and setup-profile update endpoints
- payroll run CRUD and workflow actions (generate payslips/finalize/submit)
- payslip detail and PDF retrieval
- payroll liabilities list

### 8) Integrations and Developer Platform
- Integration marketplace and connection lifecycle resources
- developer app console resources:
  - app CRUD/publish
  - OAuth client creation
  - API key issuance/revocation
  - webhook endpoint registration
  - docs/test-events endpoints
- sync logs/mapping resources and retry actions

### 9) Year-End, Tax Return, and Filing Help
- tax return package lifecycle, calculate, instructions, advisor assignment, filing mark endpoints
- annual accounts case lifecycle, tasks, output generation, advisor assignment, filing mark endpoints

### 10) Support, Onboarding, Learning, and Migration
- help article retrieval endpoints
- support ticket lifecycle + message posting + close action
- migration case lifecycle + file upload + validation view + completion
- onboarding task state updates and learning catalog endpoints

### 11) Financing and Partner Services
- financing partners listing
- financing lead create/list/detail
- consent create endpoint

### 12) Home Dashboard and Navigation
- dashboard summary and KPI endpoints
- activity-event feed endpoint
- dashboard preference read/update endpoints

## Endpoint grouping guidance for implementation
- Keep endpoint namespaces aligned to module boundaries in [Technical Module Boundaries](./TECHNICAL_MODULES.md).
- Prefer adding route groups incrementally by module subsection (for example, Module 3.1 before Module 3.2).
- Keep company scoping explicit for business data resources.

## Known mismatches to track
- Current runtime uses `/api/*` prefixed Next.js handlers with a limited MVP subset.
- Target map above is broader and written as product-facing REST resources; concrete Next.js route paths can stay `/api/*` while preserving resource grouping semantics.
- No OpenAPI artifact exists yet; this document is the canonical reference until machine-readable contracts are introduced.
