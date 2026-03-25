# Data Model

Source inputs:
- current runtime references in `supabase/migrations/*.sql`, `src/types/database.ts`, and `src/app/api/*`
- target relational model from the technical spec used in this documentation pass

Related docs: [Technical Module Boundaries](./TECHNICAL_MODULES.md), [API Contracts](./API_CONTRACTS.md), [Product Module Map](../product/PRODUCT_MODULE_MAP.md).

## Modeling conventions (target)
- PostgreSQL with UUID primary keys.
- `created_at` and `updated_at` on mutable entities.
- `deleted_at` soft-delete on user-facing business entities.
- Money represented as `amount_minor BIGINT` + `currency_code CHAR(3)` for exactness.
- Enums for stable states (`status`, `role`, `document_type`, etc.).
- Audit logging for finance-relevant changes.

## Current runtime baseline (implemented)
Current code and active API routes primarily use:
- `auth.users` -> `public.profiles`
- `public.transactions`
- `public.categories`
- `public.receipts`
- `public.companies`
- `public.company_memberships`
- `public.company_settings`
- `public.plans`
- `public.plan_entitlements`
- `public.company_subscriptions`
- `public.usage_counters`
- Supabase Storage `receipts` bucket

This remains the active MVP runtime path today. The module-aligned model below defines planned schema expansion.

### Current runtime tenancy details (implemented)
- `public.profiles.active_company_id` stores persisted active company context per authenticated user.
- `public.transactions`, `public.categories`, and `public.receipts` include `company_id` for active-company data isolation.
- `public.company_settings` includes persisted invoice settings metadata, branding/logo metadata placeholders, branch/department labels, and `cvr_number`.
- Billing baseline is internal-source-only (provider coupling intentionally deferred): `company_subscriptions.source` + seeded `plans` and `plan_entitlements` drive entitlement checks.
- Initial enforced limits are `monthly_vouchers` and `rolling_turnover_12m_dkk`; usage is tracked in `usage_counters`.

## Module-aligned schema map (target)

### 1) User and Company Management
- Identity/security: `users`, `auth_identities`, `user_sessions`, `password_reset_tokens`, `email_verification_tokens`, `mfa_methods`, `mfa_backup_codes`
- Access control: `roles`, `permissions`, `role_permissions`, `company_memberships`, `company_invitations`
- Company profile/settings: `companies`, `company_addresses`, `company_settings`, `company_branding`, `company_registry_snapshots`
- Plans/entitlements: `plans`, `plan_entitlements`, `company_subscriptions`, `usage_counters` (current runtime baseline).

### 2) Contacts and Master Data
- Contact domain: `contacts`, `contact_addresses`, `contact_people`, `contact_tags`, `contact_tag_links`
- Catalog domain: `products`, `price_lists`, `price_list_items`

### 3) Sales, Quotes, Orders, and Invoicing
- Sales documents: `sales_documents`, `sales_document_lines`, `sales_document_attachments`, `sales_document_events`, `quote_approvals`
- Recurring billing: `recurring_schedules`, `recurring_schedule_runs`
- Collections: `invoice_reminders`, `debt_collection_cases`

### 4) Accounting Core
- Ledger/fiscal: `fiscal_periods`, `accounts`, `journal_entries`, `journal_lines`
- Cashbook/manual posting: `cashbook_entries`, `posting_templates`, `posting_import_jobs`
- VAT: `vat_codes`, `vat_returns`, `vat_return_lines`, `vat_submission_logs`
- Reporting: `report_runs`, `saved_reports`
- Fixed assets: `fixed_assets`, `depreciation_schedules`

### 5) Receipts, Expenses, and Bookkeeping Automation
- Files/receipts: `files`, `receipt_extractions`, `file_links`
- Expenses: `expenses`, `expense_allocations`
- Bank/reconciliation: `bank_connections`, `bank_accounts`, `bank_transactions`, `bank_matches`, `reconciliation_runs`
- Automation/assistant: `automation_rules`, `suggestions`, `suggestion_feedback`, `assistant_tasks`

### 6) Payments and Checkout
- Payments: `payment_provider_accounts`, `payment_links`, `payment_transactions`

### 7) Payroll
- Employees: `employees`, `employee_compensation_profiles`, `employee_benefits`, `employee_pension_profiles`
- Payroll processing: `payroll_runs`, `payslips`, `payslip_lines`, `payroll_liabilities`, `payroll_submission_logs`

### 8) Integrations and Developer Platform
- Marketplace and installs: `integration_apps`, `integration_connections`
- Developer access: `developer_apps`, `oauth_clients`, `api_keys`, `webhook_endpoints`
- Sync/observability: `integration_sync_jobs`, `integration_sync_job_items`, `integration_field_mappings`, `webhook_events`

### 9) Year-End, Tax Return, and Filing Help
- Tax return flow: `tax_return_packages`, `tax_return_fields`, `tax_return_instructions`
- Annual accounts: `annual_accounts_cases`, `annual_accounts_tasks`, `annual_accounts_outputs`, `advisor_notes`

### 10) Support, Onboarding, Learning, and Migration
- Support: `support_tickets`, `support_messages`, `help_articles`
- Migration: `migration_cases`, `migration_files`, `migration_validation_issues`
- Onboarding/learning: `onboarding_checklists`, `onboarding_tasks`, `learning_courses`, `learning_lessons`

### 11) Financing and Partner Services
- Partner flows: `financing_partners`, `financing_leads`, `consent_records`

### 12) Home Dashboard and Navigation
- Dashboard data: `dashboard_preferences`, `activity_events`, `dashboard_snapshots`

## Key relationship patterns
- Multi-tenant root: most business tables include `company_id -> companies.id`.
- Membership model: users join companies through `company_memberships`; role assignments flow through `roles` + `role_permissions`.
- Accounting traceability:
  - `journal_entries` -> `journal_lines`
  - operational sources reference ledger via `source_type/source_id` or direct `journal_entry_id`.
- Sales and payments linkage:
  - `sales_documents` -> `sales_document_lines`
  - `payment_links` / `payment_transactions` -> `sales_documents`.
- File attachments as shared infrastructure:
  - `files` with `file_links` and direct nullable FKs in selected tables.

## Implementation-status alignment
- Implemented today: auth/profile + transaction/category/receipt baseline tables, initial company bootstrap tables (`companies`, `company_memberships`, `company_settings`), and baseline company RBAC primitives (`roles`, `permissions`, `role_permissions`) with invitation skeleton table (`company_invitations`).
- Planned: most company-scoped, ledger-grade, and workflow-specific tables listed above.
- Important: do not describe planned tables as already migrated unless present in `supabase/migrations` and reflected in `src/types/database.ts`.

## Known drift and caution
- Existing migrations include a legacy/divergent branch (`public.users`, `public.accounts`, alternate transaction/receipt definitions).
- Current runtime evidence still points to auth-keyed MVP tables (`profiles`, `transactions`, `categories`, `receipts`).
- When implementing this target model, migration sequencing and generated type regeneration must be handled in lockstep.
