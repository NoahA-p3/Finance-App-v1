# Settings Information Architecture (March 30, 2026)

## Intent
Settings is for configuration and defaults only. Operational workflows (e.g., transactions, receipts, reporting, onboarding, support) stay in their product areas and are not re-homed into Settings.

## Top-level tabs
The Settings area now uses these top-level sections:

1. **Personal** — user-specific profile/security/session preferences.
2. **Company** — company identity, VAT status, fiscal defaults, branding metadata, and plan/entitlements visibility.
3. **Team & Access** — membership and permission configuration surfaces.
4. **Sales & Documents** — commercial document defaults (invoice numbering/terms/templates/reminders).
5. **Accounting & Tax** — accounting policy and VAT/tax configuration surfaces.
6. **Banking & Payments** — bank/payment connectivity and sync status surfaces.
7. **Integrations** — third-party app connections and integration diagnostics.

## Strict tab exposure rules
Settings tab exposure is fail-closed and determined by both backend readiness and feature flags.

1. **Backend readiness gate first:** tabs marked as planned (no persisted model + no API contract) are hidden from navigation.
2. **Permission gate second:** company-scoped tabs still require `company.settings.manage` (or tab-specific read permissions for Team & Access).
3. **Optional planned tabs remain explicit opt-in:** Automation, Payroll, Developer, and Security & Audit are hidden unless their `NEXT_PUBLIC_ENABLE_SETTINGS_*` flag is explicitly set to `true`.
4. **Production-like environments (`NODE_ENV=production`, `VERCEL_ENV=preview|production`) must use explicit `true` for optional tabs.**
5. **Unset optional tab flags default to hidden** in all environments.

Optional tab flags:
- `NEXT_PUBLIC_ENABLE_SETTINGS_AUTOMATION`
- `NEXT_PUBLIC_ENABLE_SETTINGS_PAYROLL`
- `NEXT_PUBLIC_ENABLE_SETTINGS_DEVELOPER`
- `NEXT_PUBLIC_ENABLE_SETTINGS_SECURITY_AUDIT`

## Routing
- Settings landing page: `/settings`
- Tab routes: `/settings/<tab-key>`
- Legacy account route compatibility: `/account` now redirects to `/settings/personal`

## Current implementation notes
- Existing forms were reused to avoid disrupting persisted models and APIs.
- `CompanyProfileForm` still contains some fields that logically belong to Sales & Documents or Accounting & Tax; these are intentionally staged for incremental extraction into dedicated tab-specific forms.
- Placeholder pages are intentionally explicit where structure exists but full implementation is pending.

## Settings tab readiness matrix
**As of:** 2026-03-30.

| Tab key | Status | Persisted models used | API routes used | Known placeholders / TODOs |
|---|---|---|---|---|
| `personal` | implemented | `public.profiles`, authenticated session metadata | `/api/me/account`, `/api/me/devices`, `/api/me/login-alerts`, `/api/me/mfa/*`, `/api/me/sessions` | No dedicated outbound notification channel for login alerts in MVP. |
| `company` | implemented | `public.company_settings`, `public.companies`, `public.profiles.active_company_id`, internal billing models (`public.plans`, `public.subscriptions`, `public.plan_entitlements`) when entitlements are enabled | `/api/companies`, `/api/companies/switch`, `/api/entitlements` | Branding and branch/department fields still include placeholder metadata scaffolding. |
| `team-access` | implemented | `public.company_memberships`, `public.company_invitations`, `public.roles`, `public.role_permissions` | `/api/companies/members`, `/api/companies/invitations`, `/api/companies/invitations/accept` | Advanced role workflows are intentionally limited in MVP. |
| `sales-documents` | partial | Reuses `public.company_settings` invoice-default fields (prefix/terms/default due days) | `/api/companies` (settings persistence currently shared with Company tab) | Dedicated Sales & Documents forms/pages are pending extraction. |
| `accounting-tax` | partial | Reuses `public.company_settings` fiscal/VAT defaults | `/api/companies` (settings persistence currently shared with Company tab) | VAT engine, tax-rule automation, VAT code mappings, and filing setup are planned. |
| `banking-payments` | planned (hidden by readiness gate) | None yet | None yet | Bank connections, mapping, sync status, and provider setup are placeholders. |
| `integrations` | partial (backend-first candidate) | `public.integration_connections` | `/api/integrations` | Initial backend model/API is implemented; dedicated Settings UI controls for connect/disconnect and retry remain TODO. |
| `automation` | planned (hidden by readiness gate) | None yet | None yet | Optional feature flag exists (`NEXT_PUBLIC_ENABLE_SETTINGS_AUTOMATION`) but backend model/API readiness is not implemented. |
| `payroll` | planned (hidden by readiness gate) | None yet | None yet | Optional feature flag exists (`NEXT_PUBLIC_ENABLE_SETTINGS_PAYROLL`) but backend model/API readiness is not implemented. |
| `developer` | planned (hidden by readiness gate) | None yet | None yet | Optional feature flag exists (`NEXT_PUBLIC_ENABLE_SETTINGS_DEVELOPER`) but backend model/API readiness is not implemented. |
| `security-audit` | planned (hidden by readiness gate) | None yet | None yet | Optional feature flag exists (`NEXT_PUBLIC_ENABLE_SETTINGS_SECURITY_AUDIT`) but backend model/API readiness is not implemented. |
